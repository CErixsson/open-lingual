import type { DailyFocusSuggestion } from '@/hooks/useDailyFocus';
import { useRecommendedExercises } from '@/hooks/useExercises';
import ExerciseCard from '@/components/elo/ExerciseCard';
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  FileText,
  Library,
  Crosshair,
  Flame,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  FileText,
  Library,
};

interface DailyFocusCardProps {
  focus: DailyFocusSuggestion | null;
  languageId: string | null;
}

export default function DailyFocusCard({ focus, languageId }: DailyFocusCardProps) {
  const { data: exercises, isLoading } = useRecommendedExercises(
    languageId,
    focus?.skill.currentElo,
    focus?.skill.skillId
  );

  if (!focus) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-soft text-center text-muted-foreground text-sm">
        Gör minst en övning för att få ett dagligt fokus.
      </div>
    );
  }

  const Icon = SKILL_ICON_MAP[focus.skill.iconName || ''] || Crosshair;

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">{focus.skill.skillName}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              {focus.durationMin} min
            </span>
            {focus.challengeMode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Utmaning
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{focus.reason}</p>
        </div>
      </div>

      {/* Suggested exercises */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : exercises?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exercises.slice(0, 2).map((ex: any) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Inga övningar tillgängliga just nu.
          </p>
        )}
      </div>
    </div>
  );
}
