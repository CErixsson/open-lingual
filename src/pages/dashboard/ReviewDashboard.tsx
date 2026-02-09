import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { usePendingSubmissions } from '@/hooks/useSubmissions';
import { useCreateReview } from '@/hooks/useReviews';
import EmptyState from '@/components/shared/EmptyState';
import ErrorPanel from '@/components/shared/ErrorPanel';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, CheckCircle, MessageSquare, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: submissions, isLoading, error, refetch } = usePendingSubmissions();
  const createReview = useCreateReview();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleReview = async (submissionId: string, decision: 'approve' | 'request_changes') => {
    const comment = comments[submissionId]?.trim();
    if (!comment) {
      toast.error(t('dashboard.review.commentRequired'));
      return;
    }
    if (!user) return;

    try {
      await createReview.mutateAsync({
        submissionId,
        reviewerId: user.id,
        decision,
        comments: comment,
      });
      toast.success(decision === 'approve' ? 'Lesson approved!' : 'Changes requested.');
      setComments(prev => ({ ...prev, [submissionId]: '' }));
      setExpandedId(null);
    } catch {
      toast.error('Failed to submit review.');
    }
  };

  if (error) return <ErrorPanel onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-primary" />
        {t('dashboard.review.pending')}
        {submissions?.length ? (
          <Badge variant="secondary" className="ml-1">{submissions.length}</Badge>
        ) : null}
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : !submissions?.length ? (
        <EmptyState
          icon={ClipboardList}
          title={t('dashboard.review.emptyTitle')}
          description={t('dashboard.review.emptyDescription')}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub: any) => {
            const lesson = sub.lessons;
            const isExpanded = expandedId === sub.id;
            const exercises = Array.isArray(lesson?.exercises) ? lesson.exercises : [];

            return (
              <Card key={sub.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{lesson?.title || 'Untitled'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lesson?.language?.toUpperCase()} · {lesson?.level} · {exercises.length} exercises
                      </p>
                    </div>
                    <Badge variant="outline">{t('dashboard.review.pending')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.review.submitted')} {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-border/50 pt-4 space-y-4">
                    {/* Objectives */}
                    {lesson?.objectives?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Objectives</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                          {lesson.objectives.map((obj: string, i: number) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exercise summary */}
                    <div>
                      <p className="text-sm font-medium mb-1">Exercises ({exercises.length})</p>
                      <div className="space-y-1">
                        {exercises.map((ex: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{ex.type}</Badge>
                            <span className="truncate">{ex.prompt || 'No prompt'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* License check */}
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>License: {lesson?.license || 'CC-BY-SA-4.0'}</span>
                    </div>

                    {/* Comment & actions */}
                    <Textarea
                      placeholder={t('dashboard.review.addComment')}
                      value={comments[sub.id] || ''}
                      onChange={(e) => setComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      className="min-h-[80px]"
                      aria-label="Review comment"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(sub.id, 'approve')}
                        disabled={createReview.isPending}
                        className="flex-1"
                        aria-label={t('dashboard.review.approve')}
                      >
                        {createReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {t('dashboard.review.approve')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReview(sub.id, 'request_changes')}
                        disabled={createReview.isPending}
                        className="flex-1"
                        aria-label={t('dashboard.review.requestChanges')}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {t('dashboard.review.requestChanges')}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
