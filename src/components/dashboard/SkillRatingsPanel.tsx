import { getCefrColor, getCefrProgress, mapEloToCefr } from '@/lib/elo';
import type { CefrBand } from '@/lib/elo';
import type { SkillTrend } from '@/hooks/useDashboardStats';
import {
  Headphones, BookOpen, Mic, PenTool, FileText, Library,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  Headphones, BookOpen, Mic, PenTool, FileText, Library,
};

interface SkillRatingsPanelProps {
  trends: SkillTrend[];
  bands?: CefrBand[];
  overallElo?: number;
  overallCefr?: string;
}

export default function SkillRatingsPanel({ trends, bands, overallElo, overallCefr }: SkillRatingsPanelProps) {
  if (!trends.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No skill data yet. Complete some exercises to see your ratings!
        </CardContent>
      </Card>
    );
  }

  const sorted = [...trends].sort((a, b) => b.currentElo - a.currentElo);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const imbalance = highest.currentElo - lowest.currentElo;
  const showImbalanceWarning = imbalance > 200;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Skill Ratings</CardTitle>
          {overallElo && overallCefr && (
            <div className="flex items-center gap-2">
              <Badge
                style={{
                  backgroundColor: `hsl(${getCefrColor(overallCefr)} / 0.15)`,
                  color: `hsl(${getCefrColor(overallCefr)})`,
                }}
              >
                {overallCefr}
              </Badge>
              <span className="text-sm font-bold tabular-nums">{overallElo}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imbalance warning */}
        {showImbalanceWarning && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 px-3 py-2" style={{ backgroundColor: 'hsl(38 92% 60% / 0.1)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 92% 60%)' }} />
            <p className="text-xs text-muted-foreground">
              Your <strong>{lowest.skillName}</strong> ({lowest.currentElo}) is {imbalance} points below your <strong>{highest.skillName}</strong> ({highest.currentElo}). Focus on {lowest.skillName} to balance your skills!
            </p>
          </div>
        )}

        {/* Skill cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map(t => {
            const Icon = SKILL_ICON_MAP[t.iconName || ''] || FileText;
            const cefr = mapEloToCefr(t.currentElo, bands);
            const cefrColor = getCefrColor(cefr);
            const progress = getCefrProgress(t.currentElo, bands);
            const TrendIcon = t.trend === 'up' ? TrendingUp : t.trend === 'down' ? TrendingDown : Minus;
            const trendColor = t.trend === 'up' ? 'text-primary' : t.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

            // Promotion zone: within 50 points of next band
            const isPromotionZone = progress.nextLevel && progress.progress >= 75;

            return (
              <div
                key={t.skillId}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                  isPromotionZone
                    ? 'border-primary/40 bg-primary/5 shadow-sm'
                    : 'border-border/50 bg-card'
                }`}
              >
                {isPromotionZone && (
                  <span className="absolute -top-2 right-2 text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                    → {progress.nextLevel}
                  </span>
                )}

                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(${cefrColor} / 0.12)`,
                    color: `hsl(${cefrColor})`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <span className="text-xs font-medium text-muted-foreground">{t.skillName}</span>

                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-bold px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: `hsl(${cefrColor} / 0.15)`,
                      color: `hsl(${cefrColor})`,
                    }}
                  >
                    {cefr}
                  </span>
                  <span className="text-sm font-bold tabular-nums">{t.currentElo}</span>
                </div>

                {/* Rating change */}
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span className="tabular-nums">
                    {t.recentDelta > 0 ? '+' : ''}{t.recentDelta}
                  </span>
                </div>

                {/* Progress bar to next CEFR */}
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
      </CardContent>
    </Card>
  );
}
