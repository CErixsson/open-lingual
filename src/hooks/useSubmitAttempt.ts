import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubmitAttemptParams {
  exerciseId: string;
  answer?: number;
  scoreRaw?: number;
  timeSpentSec: number;
}

export interface AttemptResult {
  attempt: Record<string, unknown>;
  skillRating: {
    eloBefore: number;
    eloAfter: number;
    rdAfter: number;
  };
  overallElo: number;
  overallCefr: string;
  previousCefr: string;
  expectedScore: number;
  difficultyEloBefore: number;
  difficultyEloAfter: number;
  streakCount: number;
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitAttemptParams): Promise<AttemptResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-attempt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit attempt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['language-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-language-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['skill-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-exercises'] });
    },
  });
}
