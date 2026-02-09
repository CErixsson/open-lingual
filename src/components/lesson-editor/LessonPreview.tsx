import type { ExerciseBlock } from '@/pages/LessonEditor';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface LessonPreviewProps {
  lesson: {
    title: string;
    description: string;
    language: string;
    level: string;
    tags: string[];
    objectives: string[];
    exercises: ExerciseBlock[];
    version: string;
    license: string;
  };
}

export default function LessonPreview({ lesson }: LessonPreviewProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {lesson.level && <Badge variant="outline">{lesson.level}</Badge>}
          {lesson.language && (
            <span className="text-xs text-muted-foreground uppercase">{lesson.language}</span>
          )}
        </div>
        <h2 className="text-xl font-bold">{lesson.title || 'Untitled Lesson'}</h2>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
        )}
      </div>

      {/* Objectives */}
      {lesson.objectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Learning Objectives</h3>
          <ul className="space-y-1">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {lesson.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {lesson.tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Exercises */}
      {lesson.exercises.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold">Exercises ({lesson.exercises.length})</h3>
          {lesson.exercises.map((ex, i) => (
            <div key={ex.id || i} className="rounded-xl border border-border/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {ex.type.replace('_', ' ')}
                </Badge>
              </div>
              {ex.prompt && <p className="text-sm font-medium">{ex.prompt}</p>}

              {ex.type === 'multiple_choice' && (
                <div className="space-y-1.5">
                  {ex.items.map((item: any, j: number) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        item.correct ? 'border-primary/40 bg-primary/5' : 'border-border/50'
                      }`}
                    >
                      <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + j)}
                      </span>
                      {item.text || '...'}
                    </div>
                  ))}
                </div>
              )}

              {ex.type === 'cloze' && ex.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Blanks: {ex.items.map((item: any) => item.answer).join(', ')}
                </p>
              )}

              {ex.type === 'match' && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {ex.items.map((item: any, j: number) => (
                    <div key={j} className="contents">
                      <span className="rounded bg-muted px-2 py-1">{item.left || '...'}</span>
                      <span className="rounded bg-primary/10 px-2 py-1">{item.right || '...'}</span>
                    </div>
                  ))}
                </div>
              )}

              {ex.type === 'order_words' && ex.items[0]?.shuffled && (
                <div className="flex gap-1.5 flex-wrap">
                  {ex.items[0].shuffled.map((word: string, j: number) => (
                    <span key={j} className="rounded bg-muted px-2 py-1 text-sm">{word}</span>
                  ))}
                </div>
              )}

              {ex.type === 'translate' && ex.items[0] && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Source: {ex.items[0].sourceText || '...'}</p>
                  <p>Expected: {ex.items[0].expectedTranslation || '...'}</p>
                </div>
              )}

              {ex.type === 'vocabulary' && (
                <div className="space-y-1 text-sm">
                  {ex.items.map((item: any, j: number) => (
                    <div key={j} className="flex gap-3">
                      <span className="font-medium">{item.word || '...'}</span>
                      <span className="text-muted-foreground">→ {item.translation || '...'}</span>
                      {item.example && <span className="text-xs text-muted-foreground italic">"{item.example}"</span>}
                    </div>
                  ))}
                </div>
              )}

              {ex.type === 'text' && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ex.prompt}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
        <span>v{lesson.version}</span>
        <span>{lesson.license}</span>
      </div>
    </div>
  );
}
