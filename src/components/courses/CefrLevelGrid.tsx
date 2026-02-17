import { getCefrColor, mapEloToCefr } from '@/lib/elo';
import { getCefrLabels } from '@/hooks/useCourses';
import { useI18n } from '@/i18n';

interface CefrLevelGridProps {
  selectedLevel: string | null;
  onSelectLevel: (level: string) => void;
  userElo?: number;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CefrLevelGrid({ selectedLevel, onSelectLevel, userElo }: CefrLevelGridProps) {
  const { locale } = useI18n();
  const cefrLabels = getCefrLabels(locale);
  const userLevel = userElo ? mapEloToCefr(userElo) : null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {LEVELS.map(level => {
        const color = getCefrColor(level);
        const isSelected = selectedLevel === level;
        const isUserLevel = userLevel === level;

        return (
          <button
            key={level}
            onClick={() => onSelectLevel(level)}
            className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
              isSelected
                ? 'shadow-soft'
                : 'border-border/50 hover:border-primary/30 bg-card'
            }`}
            style={isSelected ? {
              borderColor: `hsl(${color})`,
              backgroundColor: `hsl(${color} / 0.08)`,
            } : undefined}
          >
            <span
              className="text-xl font-black"
              style={{ color: `hsl(${color})` }}
            >
              {level}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight text-center">
              {cefrLabels[level]}
            </span>
            {isUserLevel && (
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            )}
          </button>
        );
      })}
    </div>
  );
}
