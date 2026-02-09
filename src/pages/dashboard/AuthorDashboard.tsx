import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { useMyLessons } from '@/hooks/useLessons';
import { useCreateSubmission } from '@/hooks/useSubmissions';
import EmptyState from '@/components/shared/EmptyState';
import ErrorPanel from '@/components/shared/ErrorPanel';
import SkeletonCard from '@/components/shared/SkeletonCard';
import StatusChip from '@/components/shared/StatusChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Send, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const { data: lessons, isLoading, error, refetch } = useMyLessons(user?.id ?? null);
  const createSubmission = useCreateSubmission();

  const handleSubmitForReview = async (lessonId: string) => {
    if (!user) return;
    try {
      await createSubmission.mutateAsync({ lessonId, authorId: user.id });
      toast.success('Lesson submitted for review!');
    } catch {
      toast.error('Failed to submit lesson.');
    }
  };

  if (error) return <ErrorPanel onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          {t('dashboard.author.drafts')}
        </h2>
        <Button onClick={() => navigate('/lessons/new')} aria-label={t('dashboard.author.createLesson')}>
          <Plus className="w-4 h-4" /> {t('dashboard.author.createLesson')}
        </Button>
      </div>

      {/* Lessons list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : !lessons?.length ? (
        <EmptyState
          icon={BookOpen}
          title={t('dashboard.author.emptyTitle')}
          description={t('dashboard.author.emptyDescription')}
          actionLabel={t('dashboard.author.createLesson')}
          onAction={() => navigate('/lessons/new')}
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-card transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base truncate">{lesson.title}</CardTitle>
                      <StatusChip status={lesson.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lesson.language.toUpperCase()} · {lesson.level} · v{lesson.version}
                    </p>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{lesson.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {Array.isArray(lesson.exercises) ? (lesson.exercises as any[]).length : 0} exercises ·
                      Updated {new Date(lesson.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/lessons/${lesson.id}/edit`)}
                      aria-label={`${t('dashboard.author.editLesson')} ${lesson.title}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {lesson.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubmitForReview(lesson.id)}
                        disabled={createSubmission.isPending}
                        aria-label={`${t('dashboard.author.submitForReview')} ${lesson.title}`}
                      >
                        {createSubmission.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline ml-1">{t('dashboard.author.submitForReview')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
