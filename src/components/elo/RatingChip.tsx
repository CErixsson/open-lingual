import { getCefrColor, getCefrProgress, mapEloToCefr } from '@/lib/elo';
import type { CefrBand } from '@/lib/elo';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RatingChipProps {
  elo: number;
  rd?: number;
  bands?: CefrBand[];
  showRd?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delta?: number;
}

export default function RatingChip({
  elo,
  rd,
  bands,
  showRd = true,
  showProgress = false,
  size = 'md',
  delta,
}: RatingChipProps) {
  const cefr = mapEloToCefr(elo, bands);
  const cefrColor = getCefrColor(cefr);
  const progress = getCefrProgress(elo, bands);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
  };

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`inline-flex items-center rounded-lg border border-border/50 bg-card font-semibold ${sizeClasses[size]}`}
      >
        {/* CEFR badge */}
        <span
          className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold"
          style={{
            backgroundColor: `hsl(${cefrColor} / 0.15)`,
            color: `hsl(${cefrColor})`,
          }}
        >
          {cefr}
        </span>

        {/* Elo number */}
        <span className="tabular-nums font-bold text-foreground">{elo}</span>

        {/* RD uncertainty */}
        {showRd && rd !== undefined && (
          <span className="text-muted-foreground text-xs tabular-nums">±{rd}</span>
        )}

        {/* Delta indicator */}
        {delta !== undefined && delta !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              delta > 0 ? 'text-primary' : 'text-destructive'
            }`}
          >
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </div>

      {/* Progress bar to next CEFR band */}
      {showProgress && progress.nextLevel && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress.progress}%`,
                backgroundColor: `hsl(${cefrColor})`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            → {progress.nextLevel}
          </span>
        </div>
      )}
    </div>
  );
}
