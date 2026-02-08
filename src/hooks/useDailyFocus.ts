import { useMemo } from 'react';
import type { SkillTrend } from './useDashboardStats';

export interface DailyFocusSuggestion {
  skill: SkillTrend;
  reason: string;
  durationMin: number;
  challengeMode: boolean;
}

export function useDailyFocus(
  trends: SkillTrend[] | undefined,
  avgSessionMinutes: number = 10
): DailyFocusSuggestion | null {
  return useMemo(() => {
    if (!trends?.length) return null;

    // Score each skill: lower elo + declining trend + fewer attempts = higher priority
    const scored = trends.map(t => {
      let priority = 0;
      // Weakest skill gets boosted
      priority += (2000 - t.currentElo) / 10;
      // Declining skills get extra priority
      if (t.trend === 'down') priority += 30;
      if (t.trend === 'flat') priority += 10;
      // Low confidence = needs more practice
      priority += (100 - t.confidence) / 2;
      // Low recent attempts = missed practice
      if (t.attemptsCount < 5) priority += 20;
      return { ...t, priority };
    });

    scored.sort((a, b) => b.priority - a.priority);
    const focus = scored[0];

    // Determine reason
    let reason: string;
    if (focus.trend === 'down') {
      reason = `${focus.skillName} har tappat ${Math.abs(focus.recentDelta)} poäng senaste veckan. En kort session kan vända trenden.`;
    } else if (focus.attemptsCount < 5) {
      reason = `${focus.skillName} behöver fler övningar för att bygga upp en stabil rating.`;
    } else if (focus.confidence < 40) {
      reason = `Din confidence i ${focus.skillName} är låg. Fokuserad träning höjer den snabbt.`;
    } else {
      reason = `${focus.skillName} är din svagaste färdighet just nu. Riktad övning ger störst utdelning.`;
    }

    // Session length: shorter for users with short avg sessions
    const durationMin = Math.max(5, Math.min(15, avgSessionMinutes));

    // Challenge mode if user is doing well overall
    const challengeMode = focus.currentElo > 1200 && focus.confidence > 60;

    return { skill: focus, reason, durationMin, challengeMode };
  }, [trends, avgSessionMinutes]);
}
