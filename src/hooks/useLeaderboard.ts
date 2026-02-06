import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  rating: number;
  cefr: string;
  rd: number;
}

export function useLeaderboard(languageId: string | null) {
  return useQuery({
    queryKey: ['leaderboard', languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-leaderboard?languageId=${languageId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json() as Promise<LeaderboardEntry[]>;
    },
  });
}
