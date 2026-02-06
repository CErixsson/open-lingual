import { mapEloToCefr, getCefrColor } from '@/lib/elo';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    description: string | null;
    difficulty_elo: number;
    time_limit_sec: number | null;
    tags: string[];
    skills: {
      display_name: string;
      icon_name: string | null;
    } | null;
  };
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const cefr = mapEloToCefr(exercise.difficulty_elo);
  const cefrColor = getCefrColor(cefr);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{exercise.title}</h3>
          {exercise.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {exercise.description}
            </p>
          )}
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
          style={{
            backgroundColor: `hsl(${cefrColor} / 0.15)`,
            color: `hsl(${cefrColor})`,
          }}
        >
          {cefr}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {exercise.skills && (
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {exercise.skills.display_name}
          </span>
        )}
        <span className="tabular-nums">Elo {exercise.difficulty_elo}</span>
        {exercise.time_limit_sec && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {exercise.time_limit_sec}s
          </span>
        )}
      </div>

      {exercise.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {exercise.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Link to={`/exercise/${exercise.id}`}>
        <Button size="sm" className="w-full mt-1">
          Starta →
        </Button>
      </Link>
    </div>
  );
}
