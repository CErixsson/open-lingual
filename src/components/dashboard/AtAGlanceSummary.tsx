import { Flame, Clock, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import type { DashboardStats } from '@/hooks/useDashboardStats';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

interface AtAGlanceSummaryProps {
  overallElo: number;
  overallCefr: string;
  streak: number;
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export default function AtAGlanceSummary({
  overallElo,
  overallCefr,
  streak,
  stats,
  isLoading,
}: AtAGlanceSummaryProps) {
  const deltaIcon =
    stats?.lastSessionDelta === null || stats?.lastSessionDelta === undefined ? null :
    stats.lastSessionDelta > 0 ? <TrendingUp className="w-4 h-4" /> :
    stats.lastSessionDelta < 0 ? <TrendingDown className="w-4 h-4" /> :
    <Minus className="w-4 h-4" />;

  const deltaLabel =
    stats?.lastSessionDelta === null || stats?.lastSessionDelta === undefined
      ? 'Ingen data'
      : stats.lastSessionDelta > 0
      ? `+${stats.lastSessionDelta}`
      : stats.lastSessionDelta < 0
      ? `${stats.lastSessionDelta}`
      : '→ Stabil';

  const deltaColor =
    stats?.lastSessionDelta === null || stats?.lastSessionDelta === undefined
      ? 'text-muted-foreground'
      : stats.lastSessionDelta > 0
      ? 'text-primary'
      : stats.lastSessionDelta < 0
      ? 'text-destructive'
      : 'text-secondary';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Overall Rating */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Rating</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-foreground">{overallElo}</span>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {overallCefr}
          </span>
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
          <Flame className="w-3.5 h-3.5" />
          <span>Streak</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-secondary">{streak}</span>
          <span className="text-xs text-muted-foreground">dagar</span>
        </div>
      </div>

      {/* Time Practiced */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Tid idag</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {isLoading ? '—' : formatTime(stats?.timePracticedToday || 0)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {isLoading ? '' : `${formatTime(stats?.timePracticedWeek || 0)} denna vecka`}
          </span>
        </div>
      </div>

      {/* Last Session */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
          {deltaIcon || <TrendingUp className="w-3.5 h-3.5" />}
          <span>Senaste pass</span>
        </div>
        <div className="flex flex-col">
          <span className={`text-2xl font-bold tabular-nums ${deltaColor}`}>
            {isLoading ? '—' : deltaLabel}
          </span>
          {stats?.lastSessionSkill && (
            <span className="text-xs text-muted-foreground">{stats.lastSessionSkill}</span>
          )}
        </div>
      </div>
    </div>
  );
}
