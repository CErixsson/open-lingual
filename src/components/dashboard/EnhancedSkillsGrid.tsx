import { getCefrColor, mapEloToCefr, getCefrProgress, SKILL_ICONS } from '@/lib/elo';
import type { CefrBand, CurriculumSkill } from '@/lib/elo';
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
  curriculumSkills?: CurriculumSkill[];
}

export default function EnhancedSkillsGrid({ trends, bands, onSkillClick, curriculumSkills }: EnhancedSkillsGridProps) {
  // Build cards from curriculum skills (all 6), merging with DB trends when available
  const skillCards = (curriculumSkills && curriculumSkills.length > 0 ? curriculumSkills : []).map(skill => {
    const trend = trends.find(t => t.skillName.toLowerCase() === skill.key || t.skillId === skill.id);
    return {
      id: skill.id,
      key: skill.key,
      name: skill.display_name,
      iconName: skill.icon_name,
      category: skill.category,
      currentElo: trend?.currentElo ?? 1000,
      rd: trend?.rd ?? 350,
      attemptsCount: trend?.attemptsCount ?? 0,
      recentDelta: trend?.recentDelta ?? 0,
      trend: trend?.trend ?? ('flat' as const),
      confidence: trend?.confidence ?? 0,
    };
  });

  // If no curriculum skills loaded, fall back to trends
  const cards = skillCards.length > 0 ? skillCards : trends.map(t => ({
    id: t.skillId,
    key: t.skillName.toLowerCase(),
    name: t.skillName,
    iconName: t.iconName || 'FileText',
    category: 'productive' as const,
    currentElo: t.currentElo,
    rd: t.rd,
    attemptsCount: t.attemptsCount,
    recentDelta: t.recentDelta,
    trend: t.trend,
    confidence: t.confidence,
  }));

  if (!cards.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No skill data yet. Complete some exercises to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category labels */}
      {(['receptive', 'productive', 'building_block'] as const).map(category => {
        const categoryCards = cards.filter(c => c.category === category);
        if (categoryCards.length === 0) return null;
        const label = category === 'receptive' ? 'Receptive Skills' : category === 'productive' ? 'Productive Skills' : 'Building Blocks';
        return (
          <div key={category}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categoryCards.map((t) => {
                const Icon = SKILL_ICON_MAP[t.iconName || ''] || FileText;
                const cefr = mapEloToCefr(t.currentElo, bands);
                const cefrColor = getCefrColor(cefr);
                const progress = getCefrProgress(t.currentElo, bands);

                const TrendIcon = t.trend === 'up' ? TrendingUp : t.trend === 'down' ? TrendingDown : Minus;
                const trendColor = t.trend === 'up' ? 'text-primary' : t.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

                return (
                  <button
                    key={t.id}
                    onClick={() => onSkillClick?.(t.id)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card transition-all hover:border-primary/30 cursor-pointer relative overflow-hidden"
                  >
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
                      {t.name}
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

                    <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor} relative`}>
                      <TrendIcon className="w-3 h-3" />
                      <span className="tabular-nums">
                        {t.recentDelta > 0 ? '+' : ''}
                        {t.recentDelta}
                      </span>
                    </div>

                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress.progress}%`,
                          backgroundColor: `hsl(${cefrColor})`,
                        }}
                      />
                    </div>

                    <span className="text-[10px] text-muted-foreground tabular-nums relative">
                      {t.confidence}% confidence
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
