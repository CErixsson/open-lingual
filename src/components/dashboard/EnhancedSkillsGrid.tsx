import { getCefrColor, mapEloToCefr, getCefrProgress } from '@/lib/elo';
import type { CefrBand } from '@/lib/elo';
import type { SkillTrend } from '@/hooks/useDashboardStats';
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  FileText,
  Library,
  TrendingUp,
  TrendingDown,
  Minus,
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

interface EnhancedSkillsGridProps {
  trends: SkillTrend[];
  bands?: CefrBand[];
  onSkillClick?: (skillId: string) => void;
}

export default function EnhancedSkillsGrid({ trends, bands, onSkillClick }: EnhancedSkillsGridProps) {
  if (!trends.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Inga färdighetsdata ännu. Starta en övning!
      </div>
    );
  }

  // Sort: weakest first (visually prioritize without shaming)
  const sorted = [...trends].sort((a, b) => a.currentElo - b.currentElo);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {sorted.map((t) => {
        const Icon = SKILL_ICON_MAP[t.iconName || ''] || FileText;
        const cefr = mapEloToCefr(t.currentElo, bands);
        const cefrColor = getCefrColor(cefr);
        const progress = getCefrProgress(t.currentElo, bands);

        const TrendIcon = t.trend === 'up' ? TrendingUp : t.trend === 'down' ? TrendingDown : Minus;
        const trendColor = t.trend === 'up' ? 'text-primary' : t.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

        return (
          <button
            key={t.skillId}
            onClick={() => onSkillClick?.(t.skillId)}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card transition-all hover:border-primary/30 cursor-pointer relative overflow-hidden"
          >
            {/* Confidence bar background */}
            <div
              className="absolute bottom-0 left-0 right-0 opacity-[0.04] transition-all"
              style={{
                height: `${t.confidence}%`,
                backgroundColor: `hsl(${cefrColor})`,
              }}
            />

            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 relative"
              style={{
                backgroundColor: `hsl(${cefrColor} / 0.12)`,
                color: `hsl(${cefrColor})`,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>

            <span className="text-xs font-medium text-muted-foreground relative">
              {t.skillName}
            </span>

            <div className="flex items-center gap-1.5 relative">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `hsl(${cefrColor} / 0.15)`,
                  color: `hsl(${cefrColor})`,
                }}
              >
                {cefr}
              </span>
              <span className="text-sm font-bold tabular-nums">{t.currentElo}</span>
            </div>

            {/* Trend indicator */}
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor} relative`}>
              <TrendIcon className="w-3 h-3" />
              <span className="tabular-nums">
                {t.recentDelta > 0 ? '+' : ''}
                {t.recentDelta}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress.progress}%`,
                  backgroundColor: `hsl(${cefrColor})`,
                }}
              />
            </div>

            {/* Confidence label */}
            <span className="text-[10px] text-muted-foreground tabular-nums relative">
              {t.confidence}% confidence
            </span>
          </button>
        );
      })}
    </div>
  );
}
