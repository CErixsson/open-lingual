import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProgressPoint {
  date: string;
  elo: number;
  skillName: string;
  skillId: string;
}

export function useProgressHistory(
  profileId: string | null,
  days: number = 30
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress-history', user?.id, profileId, days],
    enabled: !!user && !!profileId,
    queryFn: async (): Promise<ProgressPoint[]> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('exercise_attempts')
        .select('started_at, elo_after, skill_id, skills(display_name)')
        .eq('user_id', user!.id)
        .eq('user_language_profile_id', profileId!)
        .gte('started_at', since)
        .order('started_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        date: d.started_at,
        elo: d.elo_after,
        skillName: (d.skills as any)?.display_name || 'Overall',
        skillId: d.skill_id,
      }));
    },
    staleTime: 60_000,
  });
}

export interface PeriodComparison {
  current: { avgElo: number; sessions: number; timeSpent: number; passRate: number };
  previous: { avgElo: number; sessions: number; timeSpent: number; passRate: number };
}

export function usePeriodComparison(
  profileId: string | null,
  periodDays: number = 7
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['period-comparison', user?.id, profileId, periodDays],
    enabled: !!user && !!profileId,
    queryFn: async (): Promise<PeriodComparison> => {
      const now = Date.now();
      const currentStart = new Date(now - periodDays * 24 * 60 * 60 * 1000).toISOString();
      const previousStart = new Date(now - periodDays * 2 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('exercise_attempts')
        .select('started_at, elo_after, time_spent_sec, passed')
        .eq('user_id', user!.id)
        .eq('user_language_profile_id', profileId!)
        .gte('started_at', previousStart)
        .order('started_at', { ascending: true });

      if (error) throw error;

      const currentAttempts = (data || []).filter(a => a.started_at >= currentStart);
      const previousAttempts = (data || []).filter(
        a => a.started_at >= previousStart && a.started_at < currentStart
      );

      const calcStats = (attempts: typeof data) => {
        if (!attempts?.length) return { avgElo: 0, sessions: 0, timeSpent: 0, passRate: 0 };
        const avgElo = Math.round(
          attempts.reduce((s, a) => s + a.elo_after, 0) / attempts.length
        );
        const timeSpent = attempts.reduce((s, a) => s + (a.time_spent_sec || 0), 0);
        const passRate = Math.round(
          (attempts.filter(a => a.passed).length / attempts.length) * 100
        );
        return { avgElo, sessions: attempts.length, timeSpent, passRate };
      };

      return {
        current: calcStats(currentAttempts),
        previous: calcStats(previousAttempts),
      };
    },
    staleTime: 60_000,
  });
}
