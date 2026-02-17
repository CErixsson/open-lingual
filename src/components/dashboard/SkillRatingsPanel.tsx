import { getCefrColor, getCefrProgress, mapEloToCefr } from '@/lib/elo';
import type { CefrBand } from '@/lib/elo';
import type { SkillTrend } from '@/hooks/useDashboardStats';
import {
  Headphones, BookOpen, Mic, PenTool, FileText, Library,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  Headphones, BookOpen, Mic, PenTool, FileText, Library,
};

interface SkillRatingsPanelProps {
  trends: SkillTrend[];
  bands?: CefrBand[];
  overallElo?: number;
  overallCefr?: string;
  languageName?: string;
  languageFlag?: string;
}

export default function SkillRatingsPanel({ trends, bands, overallElo, overallCefr, languageName, languageFlag }: SkillRatingsPanelProps) {
  if (!trends.length) return null;

  const sorted = [...trends].sort((a, b) => b.currentElo - a.currentElo);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const imbalance = highest.currentElo - lowest.currentElo;
  const showImbalanceWarning = imbalance > 200;

  return (
    <div className="space-y-3">
      {/* Compact header row with overall rating */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {languageFlag && <span>{languageFlag}</span>}
          Skill Ratings {languageName && <span className="font-normal">· {languageName}</span>}
        </h3>
        {overallElo && overallCefr && (
          <div className="flex items-center gap-1.5">
            <Badge
              className="text-[10px] font-bold"
              style={{
                backgroundColor: `hsl(${getCefrColor(overallCefr)} / 0.15)`,
                color: `hsl(${getCefrColor(overallCefr)})`,
              }}
            >
              {overallCefr}
            </Badge>
            <span className="text-xs font-bold tabular-nums text-muted-foreground">{overallElo}</span>
          </div>
        )}
      </div>

      {/* Imbalance warning */}
      {showImbalanceWarning && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 px-3 py-2" style={{ backgroundColor: 'hsl(38 92% 60% / 0.1)' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(38 92% 60%)' }} />
          <p className="text-xs text-muted-foreground">
            <strong>{lowest.skillName}</strong> is {imbalance}pts below <strong>{highest.skillName}</strong>
          </p>
        </div>
      )}

      {/* Compact inline skill chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {sorted.map(t => {
          const Icon = SKILL_ICON_MAP[t.iconName || ''] || FileText;
          const cefr = mapEloToCefr(t.currentElo, bands);
          const cefrColor = getCefrColor(cefr);
          const progress = getCefrProgress(t.currentElo, bands);
          const TrendIcon = t.trend === 'up' ? TrendingUp : t.trend === 'down' ? TrendingDown : Minus;
          const trendColor = t.trend === 'up' ? 'text-primary' : t.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

          return (
            <div
              key={t.skillId}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/50 bg-card p-2.5"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `hsl(${cefrColor} / 0.12)`,
                  color: `hsl(${cefrColor})`,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                {t.skillName}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: `hsl(${cefrColor} / 0.15)`,
                    color: `hsl(${cefrColor})`,
                  }}
                >
                  {cefr}
                </span>
                <span className="text-xs font-bold tabular-nums">{t.currentElo}</span>
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] ${trendColor}`}>
                <TrendIcon className="w-2.5 h-2.5" />
                <span className="tabular-nums">{t.recentDelta > 0 ? '+' : ''}{t.recentDelta}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress.progress}%`,
                    backgroundColor: `hsl(${cefrColor})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}