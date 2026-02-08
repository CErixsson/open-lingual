import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DashboardStats {
  timePracticedToday: number;
  timePracticedWeek: number;
  lastSessionDelta: number | null; // positive = improved, 0 = stable, negative = decline
  lastSessionSkill: string | null;
  totalSessions: number;
  sessionsToday: number;
  sessionsWeek: number;
}

export function useDashboardStats(profileId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, profileId],
    enabled: !!user && !!profileId,
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

      // Fetch attempts for the last 7 days
      const { data: attempts, error } = await supabase
        .from('exercise_attempts')
        .select('time_spent_sec, elo_before, elo_after, started_at, skill_id, skills(display_name)')
        .eq('user_id', user!.id)
        .eq('user_language_profile_id', profileId!)
        .gte('started_at', weekStart)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const todayAttempts = (attempts || []).filter(a => a.started_at >= todayStart);
      const timePracticedToday = todayAttempts.reduce((sum, a) => sum + (a.time_spent_sec || 0), 0);
      const timePracticedWeek = (attempts || []).reduce((sum, a) => sum + (a.time_spent_sec || 0), 0);

      // Last session result
      const lastAttempt = attempts?.[0];
      const lastSessionDelta = lastAttempt
        ? lastAttempt.elo_after - lastAttempt.elo_before
        : null;
      const lastSessionSkill = lastAttempt
        ? (lastAttempt.skills as any)?.display_name || null
        : null;

      return {
        timePracticedToday,
        timePracticedWeek,
        lastSessionDelta,
        lastSessionSkill,
        totalSessions: attempts?.length || 0,
        sessionsToday: todayAttempts.length,
        sessionsWeek: attempts?.length || 0,
      };
    },
    staleTime: 30_000,
  });
}

export interface SkillTrend {
  skillId: string;
  skillName: string;
  iconName: string | null;
  currentElo: number;
  rd: number;
  attemptsCount: number;
  recentDelta: number; // elo change over last 7 days
  trend: 'up' | 'down' | 'flat';
  confidence: number; // 0-100 based on attempts + accuracy
}

export function useSkillTrends(profileId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['skill-trends', user?.id, profileId],
    enabled: !!user && !!profileId,
    queryFn: async (): Promise<SkillTrend[]> => {
      // Fetch skill ratings
      const { data: ratings, error: ratingsErr } = await supabase
        .from('user_skill_ratings')
        .select('*, skills(*)')
        .eq('user_language_profile_id', profileId!);
      if (ratingsErr) throw ratingsErr;

      // Fetch recent attempts per skill (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAttempts, error: attemptsErr } = await supabase
        .from('exercise_attempts')
        .select('skill_id, elo_before, elo_after, passed')
        .eq('user_id', user!.id)
        .eq('user_language_profile_id', profileId!)
        .gte('started_at', weekAgo);
      if (attemptsErr) throw attemptsErr;

      return (ratings || []).map(rating => {
        const skill = rating.skills as any;
        const skillAttempts = (recentAttempts || []).filter(a => a.skill_id === rating.skill_id);
        const recentDelta = skillAttempts.reduce(
          (sum, a) => sum + (a.elo_after - a.elo_before),
          0
        );
        const passRate = skillAttempts.length > 0
          ? skillAttempts.filter(a => a.passed).length / skillAttempts.length
          : 0;
        // Confidence: combo of attempts count and accuracy
        const confidenceFromAttempts = Math.min(50, rating.attempts_count * 2.5);
        const confidenceFromAccuracy = passRate * 50;
        const confidence = Math.round(confidenceFromAttempts + confidenceFromAccuracy);

        return {
          skillId: rating.skill_id,
          skillName: skill?.display_name || 'Unknown',
          iconName: skill?.icon_name || null,
          currentElo: rating.elo,
          rd: rating.rd,
          attemptsCount: rating.attempts_count,
          recentDelta,
          trend: recentDelta > 5 ? 'up' : recentDelta < -5 ? 'down' : 'flat',
          confidence,
        };
      });
    },
    staleTime: 30_000,
  });
}
