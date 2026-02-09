import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import type { ExerciseBlock } from '@/pages/LessonEditor';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationPanelProps {
  lesson: {
    title: string;
    language: string;
    level: string;
    exercises: ExerciseBlock[];
  };
}

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

export default function ValidationPanel({ lesson }: ValidationPanelProps) {
  const { t } = useI18n();

  const issues = useMemo(() => {
    const result: ValidationIssue[] = [];

    if (!lesson.title.trim()) {
      result.push({ type: 'error', message: t('validation.titleRequired') });
    }
    if (!lesson.language) {
      result.push({ type: 'error', message: t('validation.languageRequired') });
    }
    if (!lesson.level) {
      result.push({ type: 'error', message: t('validation.levelRequired') });
    }

    const exerciseBlocks = lesson.exercises.filter(e =>
      ['multiple_choice', 'cloze', 'match', 'order_words', 'translate'].includes(e.type)
    );

    if (exerciseBlocks.length === 0) {
      result.push({ type: 'warning', message: t('validation.noExercises') });
    }

    exerciseBlocks.forEach((ex, i) => {
      if (!ex.prompt?.trim()) {
        result.push({ type: 'warning', message: `Exercise #${i + 1}: ${t('validation.exerciseMissingPrompt')}` });
      }

      if (ex.type === 'multiple_choice') {
        if (ex.items.length < 2) {
          result.push({ type: 'error', message: `Exercise #${i + 1}: ${t('validation.exerciseMissingOptions')}` });
        }
        if (!ex.items.some((item: any) => item.correct)) {
          result.push({ type: 'error', message: `Exercise #${i + 1}: ${t('validation.exerciseNoCorrectAnswer')}` });
        }
      }
    });

    return result;
  }, [lesson, t]);

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const allPassed = issues.length === 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Validation Results
      </h3>

      {allPassed ? (
        <div className="flex items-center gap-2 py-4 text-primary" role="status">
          <CheckCircle2 className="w-6 h-6" />
          <p className="font-medium">{t('validation.allPassed')}</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Validation issues">
          {errors.map((issue, i) => (
            <div key={`e-${i}`} className="flex items-start gap-2 text-sm" role="listitem">
              <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
          {warnings.map((issue, i) => (
            <div key={`w-${i}`} className="flex items-start gap-2 text-sm" role="listitem">
              <AlertTriangle className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border/30">
        <span>{errors.length} errors</span>
        <span>{warnings.length} warnings</span>
      </div>
    </div>
  );
}
