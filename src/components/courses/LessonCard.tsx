import { Link } from 'react-router-dom';
import { getCefrColor } from '@/lib/elo';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    level: string;
    language: string;
    phases: any;
    tags: string[] | null;
    objectives?: string[] | null;
  };
  progress?: { completion_percent: number } | null;
}

export default function LessonCard({ lesson, progress }: LessonCardProps) {
  const cefrColor = getCefrColor(lesson.level);
  const phaseCount = Array.isArray(lesson.phases) ? lesson.phases.length : 0;
  const isCompleted = progress && progress.completion_percent >= 100;
  const isStarted = progress && progress.completion_percent > 0 && progress.completion_percent < 100;

  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className={`group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-soft hover:shadow-card transition-all ${
        isCompleted ? 'border-primary/30 bg-primary/5' : isStarted ? 'border-accent/30' : 'border-border/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {lesson.title}
            </p>
            {lesson.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {lesson.description}
              </p>
            )}
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
          style={{
            backgroundColor: `hsl(${cefrColor} / 0.15)`,
            color: `hsl(${cefrColor})`,
          }}
        >
          {lesson.level}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {phaseCount} phases
          </Badge>
          {lesson.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        {isStarted && progress ? (
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress.completion_percent}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{progress.completion_percent}%</span>
          </div>
        ) : (
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </Link>
  );
}
