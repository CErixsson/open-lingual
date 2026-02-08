import type { CoachingInsight } from '@/hooks/useCoachingInsights';
import { Lightbulb, AlertTriangle, Trophy, Target, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<CoachingInsight['icon'], LucideIcon> = {
  lightbulb: Lightbulb,
  warning: AlertTriangle,
  trophy: Trophy,
  target: Target,
};

const ICON_COLORS: Record<CoachingInsight['icon'], string> = {
  lightbulb: 'text-secondary bg-secondary/10',
  warning: 'text-destructive bg-destructive/10',
  trophy: 'text-primary bg-primary/10',
  target: 'text-accent bg-accent/10',
};

interface CoachingPanelProps {
  insights: CoachingInsight[] | undefined;
  isLoading: boolean;
}

export default function CoachingPanel({ insights, isLoading }: CoachingPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-soft flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!insights?.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-soft text-center text-muted-foreground text-sm">
        Gör fler övningar för att få personliga insikter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const Icon = ICON_MAP[insight.icon];
        const colorClass = ICON_COLORS[insight.icon];

        return (
          <div
            key={insight.id}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-soft flex gap-3 items-start"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-0.5">{insight.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
