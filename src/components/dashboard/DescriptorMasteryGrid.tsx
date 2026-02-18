import { getCefrColor } from '@/lib/elo';
import { CheckCircle2, Circle, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DescriptorStatus = 'not_started' | 'in_progress' | 'achieved' | 'mastered';

export interface DescriptorItem {
  id: string | number;
  text: string;
  level: string;
  scale?: string;
  status: DescriptorStatus;
}

interface DescriptorMasteryGridProps {
  descriptors: DescriptorItem[];
  level: string;
}

const statusConfig: Record<DescriptorStatus, { icon: typeof Circle; label: string; colorClass: string }> = {
  not_started: { icon: Circle, label: 'Not started', colorClass: 'text-muted-foreground' },
  in_progress: { icon: Circle, label: 'In progress', colorClass: 'text-accent' },
  achieved: { icon: CheckCircle2, label: 'Achieved', colorClass: 'text-primary' },
  mastered: { icon: Star, label: 'Mastered', colorClass: 'text-secondary' },
};

export default function DescriptorMasteryGrid({ descriptors, level }: DescriptorMasteryGridProps) {
  const color = getCefrColor(level);
  const achieved = descriptors.filter(d => d.status === 'achieved' || d.status === 'mastered').length;
  const total = descriptors.length;

  if (!descriptors.length) return null;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: `hsl(${color})` }}>
            {level} Descriptors
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {achieved}/{total} achieved
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {descriptors.map((d) => {
            const cfg = statusConfig[d.status];
            const Icon = cfg.icon;
            return (
              <Tooltip key={d.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
                      d.status === 'mastered'
                        ? 'border-secondary/40 bg-secondary/10'
                        : d.status === 'achieved'
                        ? 'border-primary/40 bg-primary/10'
                        : d.status === 'in_progress'
                        ? 'border-accent/40 bg-accent/10'
                        : 'border-border/50 bg-card'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${cfg.colorClass}`} />
                    <span className={`max-w-[120px] truncate ${d.status === 'not_started' ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {d.scale || d.text.slice(0, 30)}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{d.text}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{cfg.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
