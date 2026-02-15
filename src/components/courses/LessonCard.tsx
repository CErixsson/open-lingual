import { Link } from 'react-router-dom';
import { getCefrColor } from '@/lib/elo';
import { FileText, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    level: string;
    language: string;
    exercises: any;
    tags: string[] | null;
  };
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const cefrColor = getCefrColor(lesson.level);
  const exerciseCount = Array.isArray(lesson.exercises) ? lesson.exercises.length : 0;

  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2">
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
            {exerciseCount} övningar
          </Badge>
          {lesson.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
