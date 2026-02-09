import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type LearnerProgress = Tables<'learner_progress'>;

export function useMyProgress(userId: string | null) {
  return useQuery({
    queryKey: ['learner-progress', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learner_progress')
        .select('*, lessons(title, language, level)')
        .eq('user_id', userId!)
        .order('last_activity_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (progress: {
      user_id: string;
      lesson_id: string;
      completion_percent: number;
      xp: number;
      streak_days?: number;
    }) => {
      const { data, error } = await supabase
        .from('learner_progress')
        .upsert(
          { ...progress, last_activity_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-progress'] });
    },
  });
}

export function useRecentAttempts(userId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['lesson-attempts', userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_attempts')
        .select('*, lessons(title)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useProgressStats(userId: string | null) {
  return useQuery({
    queryKey: ['progress-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learner_progress')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;

      const totalXp = data?.reduce((sum, p) => sum + (p.xp || 0), 0) ?? 0;
      const maxStreak = data?.reduce((max, p) => Math.max(max, p.streak_days || 0), 0) ?? 0;
      const completed = data?.filter(p => p.completion_percent >= 100).length ?? 0;
      const inProgress = data?.filter(p => p.completion_percent > 0 && p.completion_percent < 100).length ?? 0;

      return { totalXp, maxStreak, completed, inProgress, total: data?.length ?? 0 };
    },
  });
}
