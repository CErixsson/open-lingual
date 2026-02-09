import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { useMyProgress, useProgressStats, useRecentAttempts } from '@/hooks/useLearnerProgress';
import { usePublishedLessons } from '@/hooks/useLessons';
import EmptyState from '@/components/shared/EmptyState';
import ErrorPanel from '@/components/shared/ErrorPanel';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Flame, Trophy, ArrowRight, Play,
  CheckCircle2, XCircle, BarChart3, Clock,
} from 'lucide-react';

export default function LearnDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const { data: progress, isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useMyProgress(user?.id ?? null);
  const { data: stats, isLoading: statsLoading } = useProgressStats(user?.id ?? null);
  const { data: attempts } = useRecentAttempts(user?.id ?? null, 10);
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = usePublishedLessons();

  // Find most recent in-progress lesson
  const continueLesson = progress?.find(
    (p: any) => p.completion_percent > 0 && p.completion_percent < 100
  );

  if (progressError || lessonsError) {
    return <ErrorPanel onRetry={() => { refetchProgress(); refetchLessons(); }} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      {statsLoading ? (
        <SkeletonCard lines={1} />
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.totalXp}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.learn.xp')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.maxStreak}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.learn.streak')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.learn.completed')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Continue learning card */}
      {continueLesson && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">{t('dashboard.learn.continueLesson')}</p>
                <p className="text-sm text-muted-foreground">
                  {(continueLesson as any).lessons?.title} · {(continueLesson as any).completion_percent}%
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/lessons/${(continueLesson as any).lesson_id}/play`)}
              aria-label={t('dashboard.learn.resume')}
            >
              {t('dashboard.learn.resume')} <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick link to skill ratings */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/skills')} aria-label={t('dashboard.learn.viewSkills')}>
          <BarChart3 className="w-4 h-4 mr-1" /> {t('dashboard.learn.viewSkills')}
        </Button>
      </div>

      {/* Lessons list */}
      <section aria-label={t('dashboard.learn.assignedLessons')}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {t('dashboard.learn.assignedLessons')}
        </h2>
        {lessonsLoading || progressLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : !lessons?.length ? (
          <EmptyState
            icon={BookOpen}
            title={t('dashboard.learn.emptyTitle')}
            description={t('dashboard.learn.emptyDescription')}
            actionLabel={t('dashboard.learn.exploreLessons')}
            onAction={() => navigate('/courses')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const myProgress = progress?.find((p: any) => p.lesson_id === lesson.id);
              return (
                <Card
                  key={lesson.id}
                  className="hover:shadow-card transition-shadow cursor-pointer group"
                  tabIndex={0}
                  role="button"
                  aria-label={`${lesson.title} - ${lesson.level}`}
                  onClick={() => navigate(`/lessons/${lesson.id}/play`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/lessons/${lesson.id}/play`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{lesson.level}</Badge>
                      <span className="text-xs text-muted-foreground uppercase">{lesson.language}</span>
                    </div>
                    <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lesson.description}</p>
                    )}
                    {myProgress && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(myProgress as any).completion_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {(myProgress as any).completion_percent}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section aria-label={t('dashboard.learn.recentActivity')}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          {t('dashboard.learn.recentActivity')}
        </h2>
        {!attempts?.length ? (
          <p className="text-sm text-muted-foreground py-4">{t('dashboard.learn.noActivity')}</p>
        ) : (
          <div className="space-y-2">
            {attempts.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
              >
                {a.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm flex-1 truncate">{a.lessons?.title || 'Exercise'}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {a.time_ms ? `${(a.time_ms / 1000).toFixed(1)}s` : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
