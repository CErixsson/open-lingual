import { getCefrColor } from '@/lib/elo';
import { CheckCircle2, Lock } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface LevelStatus {
  level: string;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
}

interface CefrProgressBarProps {
  levelStatuses: LevelStatus[];
  currentLevel: string;
  onSelectLevel?: (level: string) => void;
}

export default function CefrProgressBar({ levelStatuses, currentLevel, onSelectLevel }: CefrProgressBarProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">CEFR Progress</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {levelStatuses.map(({ level, totalLessons, completedLessons, isUnlocked }) => {
          const color = getCefrColor(level);
          const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const isComplete = totalLessons > 0 && completedLessons >= totalLessons;
          const isCurrent = level === currentLevel;

          return (
            <button
              key={level}
              onClick={() => isUnlocked && onSelectLevel?.(level)}
              disabled={!isUnlocked}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                isCurrent
                  ? 'shadow-soft'
                  : isUnlocked
                  ? 'border-border/50 hover:border-primary/30 bg-card cursor-pointer'
                  : 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
              }`}
              style={isCurrent ? {
                borderColor: `hsl(${color})`,
                backgroundColor: `hsl(${color} / 0.08)`,
              } : undefined}
            >
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 absolute top-1.5 right-1.5" style={{ color: `hsl(${color})` }} />
              ) : !isUnlocked ? (
                <Lock className="w-3 h-3 absolute top-1.5 right-1.5 text-muted-foreground" />
              ) : null}

              <span className="text-lg font-black" style={{ color: isUnlocked ? `hsl(${color})` : undefined }}>
                {level}
              </span>

              {/* Mini progress bar */}
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `hsl(${color})`,
                  }}
                />
              </div>

              <span className="text-[9px] text-muted-foreground tabular-nums">
                {isUnlocked ? `${completedLessons}/${totalLessons}` : '🔒'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
