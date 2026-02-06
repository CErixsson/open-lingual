import { getCefrColor, mapEloToCefr, getCefrProgress } from '@/lib/elo';
import type { CefrBand } from '@/lib/elo';
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  FileText,
  Library,
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

interface SkillRating {
  id: string;
  elo: number;
  rd: number;
  attempts_count: number;
  skills: {
    id: string;
    key: string;
    display_name: string;
    icon_name: string | null;
  } | null;
}

interface SkillsGridProps {
  ratings: SkillRating[];
  bands?: CefrBand[];
  onSkillClick?: (skillId: string) => void;
}

export default function SkillsGrid({ ratings, bands, onSkillClick }: SkillsGridProps) {
  if (!ratings.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Inga färdighetsdata ännu. Starta en övning!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {ratings.map((rating) => {
        const skill = rating.skills;
        if (!skill) return null;

        const Icon = SKILL_ICON_MAP[skill.icon_name || ''] || FileText;
        const cefr = mapEloToCefr(rating.elo, bands);
        const cefrColor = getCefrColor(cefr);
        const progress = getCefrProgress(rating.elo, bands);

        return (
          <button
            key={rating.id}
            onClick={() => onSkillClick?.(skill.id)}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card transition-all hover:border-primary/30 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `hsl(${cefrColor} / 0.12)`,
                color: `hsl(${cefrColor})`,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>

            <span className="text-xs font-medium text-muted-foreground">
              {skill.display_name}
            </span>

            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `hsl(${cefrColor} / 0.15)`,
                  color: `hsl(${cefrColor})`,
                }}
              >
                {cefr}
              </span>
              <span className="text-sm font-bold tabular-nums">{rating.elo}</span>
            </div>

            {/* Mini progress bar */}
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress.progress}%`,
                  backgroundColor: `hsl(${cefrColor})`,
                }}
              />
            </div>

            <span className="text-xs text-muted-foreground tabular-nums">
              ±{rating.rd} · {rating.attempts_count} försök
            </span>
          </button>
        );
      })}
    </div>
  );
}
