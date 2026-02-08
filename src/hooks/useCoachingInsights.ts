import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SkillTrend } from './useDashboardStats';

export interface CoachingInsight {
  id: string;
  icon: 'lightbulb' | 'warning' | 'trophy' | 'target';
  title: string;
  description: string;
  priority: number;
}

export function useCoachingInsights(
  profileId: string | null,
  trends: SkillTrend[] | undefined,
  overallElo: number | undefined
) {
  return useQuery({
    queryKey: ['coaching-insights', profileId, trends?.map(t => t.currentElo).join(',')],
    enabled: !!profileId && !!trends?.length,
    queryFn: async (): Promise<CoachingInsight[]> => {
      // Fetch data for analysis
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: attempts } = await supabase
        .from('exercise_attempts')
        .select('skill_id, passed, time_spent_sec, elo_before, elo_after, started_at, skills(display_name)')
        .eq('user_language_profile_id', profileId!)
        .gte('started_at', weekAgo)
        .order('started_at', { ascending: false });

      const insights: CoachingInsight[] = [];
      if (!trends || !attempts) return insights;

      // 1. Skill imbalance detection
      const sortedByElo = [...trends].sort((a, b) => a.currentElo - b.currentElo);
      const weakest = sortedByElo[0];
      const strongest = sortedByElo[sortedByElo.length - 1];
      if (strongest && weakest && strongest.currentElo - weakest.currentElo > 150) {
        insights.push({
          id: 'skill-gap',
          icon: 'target',
          title: `${weakest.skillName} halkar efter`,
          description: `Din ${strongest.skillName} är stark (${strongest.currentElo}), men ${weakest.skillName} (${weakest.currentElo}) ligger ${strongest.currentElo - weakest.currentElo} poäng efter. Korta dagliga övningar i ${weakest.skillName} rekommenderas.`,
          priority: 90,
        });
      }

      // 2. Performance drop detection
      const decliningSkills = trends.filter(t => t.trend === 'down');
      if (decliningSkills.length > 0) {
        const names = decliningSkills.map(s => s.skillName).join(', ');
        insights.push({
          id: 'decline',
          icon: 'warning',
          title: `Nedgång i ${names}`,
          description: `${decliningSkills.map(s => `${s.skillName} ${s.recentDelta}`).join(', ')} senaste veckan. Fokusera på dessa för att bryta trenden.`,
          priority: 85,
        });
      }

      // 3. Session length optimization
      const avgTime = attempts.length > 0
        ? attempts.reduce((s, a) => s + (a.time_spent_sec || 0), 0) / attempts.length
        : 0;
      if (avgTime > 1800) {
        insights.push({
          id: 'session-length',
          icon: 'lightbulb',
          title: 'Kortare sessioner rekommenderas',
          description: `Du tränar i snitt ${Math.round(avgTime / 60)} minuter per pass. Forskning visar att 15-20 minuter ger bättre retention. Prova kortare, mer frekventa sessioner.`,
          priority: 60,
        });
      }

      // 4. Consistency praise
      const uniqueDays = new Set(attempts.map(a => a.started_at.split('T')[0]));
      if (uniqueDays.size >= 5) {
        insights.push({
          id: 'consistency',
          icon: 'trophy',
          title: 'Stark konsistens!',
          description: `Du har övat ${uniqueDays.size} av 7 dagar denna vecka. Regelbundenhet är den viktigaste faktorn för framsteg.`,
          priority: 40,
        });
      }

      // 5. Accuracy pattern
      const passRate = attempts.length > 0
        ? attempts.filter(a => a.passed).length / attempts.length
        : 0;
      if (passRate < 0.4 && attempts.length >= 5) {
        insights.push({
          id: 'accuracy-low',
          icon: 'warning',
          title: 'Svårighetsgraden kan vara för hög',
          description: `Din träffsäkerhet är ${Math.round(passRate * 100)}% senaste veckan. Prova lättare övningar för att bygga upp ett starkt fundament.`,
          priority: 80,
        });
      } else if (passRate > 0.9 && attempts.length >= 5) {
        insights.push({
          id: 'accuracy-high',
          icon: 'lightbulb',
          title: 'Dags att utmana dig mer',
          description: `Du klarar ${Math.round(passRate * 100)}% av övningarna. Det tyder på att du kan ta dig an svårare material för snabbare progression.`,
          priority: 70,
        });
      }

      // Sort by priority, limit to 3
      return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
    },
    staleTime: 5 * 60_000, // 5 min
  });
}
