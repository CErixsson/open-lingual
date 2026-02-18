import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { useMyProgress, useProgressStats, useRecentAttempts } from '@/hooks/useLearnerProgress';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { useSkillTrends } from '@/hooks/useDashboardStats';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';
import EmptyState from '@/components/shared/EmptyState';
import SkeletonCard from '@/components/shared/SkeletonCard';
import SkillRatingsPanel from '@/components/dashboard/SkillRatingsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Flame, Trophy, ArrowRight, Play,
  CheckCircle2, BarChart3, Clock, MessageCircle, RotateCcw, GraduationCap, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LearnDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const {
    profiles,
    activeProfile,
    activeLanguage,
    activeLanguageCode,
    activeLanguageName,
    activeLanguageFlag,
    setActiveProfileId,
  } = useActiveLanguage();

  const { data: progress, isLoading: progressLoading } = useMyProgress(user?.id ?? null);
  const { data: stats, isLoading: statsLoading } = useProgressStats(user?.id ?? null);
  const { data: attempts } = useRecentAttempts(user?.id ?? null, 10);
  const { data: skillTrends } = useSkillTrends(activeProfile?.id ?? null);

  // Load curriculum lessons (JSON-based) for active language
  const { data: curriculumLessons, isLoading: lessonsLoading } = useCurriculumLessons(activeLanguageCode);

  // Continue lesson: most recent in-progress from learner_progress
  const continueLesson = progress?.find(
    (p: any) => p.completion_percent > 0 && p.completion_percent < 100
  );

  // Recent curriculum lesson attempts: map lesson_id from attempts to curriculum lesson titles
  const recentLessonIds = [...new Set(attempts?.map((a: any) => a.lesson_id) ?? [])].slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Active Language Header + Switcher */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeLanguageFlag}</span>
            <div>
              <p className="font-semibold leading-tight">{activeLanguageName ?? 'Select a language'}</p>
              {activeProfile && (
                <p className="text-xs text-muted-foreground">
                  {activeProfile.overall_cefr} · {activeProfile.overall_elo} ELO
                </p>
              )}
            </div>
          </div>
          {profiles.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profiles.map((p: any) => {
                  const lang = p.languages;
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setActiveProfileId(p.id)}
                      className={activeProfile?.id === p.id ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">{lang?.flag_emoji}</span>
                      {lang?.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem onClick={() => navigate('/courses')} className="border-t mt-1 pt-2 text-primary">
                  <GraduationCap className="w-4 h-4 mr-2" /> Add a language
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
              <GraduationCap className="w-4 h-4 mr-1" /> Add language
            </Button>
          )}
        </div>
      )}

      {/* No language selected yet */}
      {profiles.length === 0 && !progressLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Choose a language to learn</p>
              <p className="text-sm text-muted-foreground">Pick your first language to get started</p>
            </div>
            <Button size="sm" onClick={() => navigate('/courses')}>
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

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
                <p className="text-xs text-muted-foreground">XP</p>
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
                <p className="text-xs text-muted-foreground">Streak</p>
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
                <p className="text-xs text-muted-foreground">Completed</p>
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
                <p className="font-semibold">Continue Lesson</p>
                <p className="text-sm text-muted-foreground">
                  {(continueLesson as any).lessons?.title} · {(continueLesson as any).completion_percent}%
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/lessons/${(continueLesson as any).lesson_id}`)}
            >
              Resume <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skill ratings panel */}
      {skillTrends && skillTrends.length > 0 && (
        <SkillRatingsPanel
          trends={skillTrends}
          overallElo={activeProfile?.overall_elo}
          overallCefr={activeProfile?.overall_cefr}
          languageName={activeLanguageName}
          languageFlag={activeLanguageFlag}
        />
      )}

      {/* Quick links */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/scenarios')}>
          <MessageCircle className="w-4 h-4 mr-1" /> Scenarios
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/skills')}>
          <BarChart3 className="w-4 h-4 mr-1" /> Skills
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
          <GraduationCap className="w-4 h-4 mr-1" /> Courses
        </Button>
      </div>

      {/* Curriculum Lessons for active language */}
      {activeLanguageCode && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Your Learning Path
            {activeLanguageFlag && <span>{activeLanguageFlag}</span>}
          </h2>
          {lessonsLoading || progressLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : !curriculumLessons?.length ? (
            <EmptyState
              icon={BookOpen}
              title="No lessons yet"
              description={`We're building lessons for ${activeLanguageName}. Check back soon!`}
              actionLabel="Explore Courses"
              onAction={() => navigate('/courses')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculumLessons.map((lesson) => {
                const myProgress = progress?.find((p: any) => p.lesson_id === lesson.id);
                const completionPct = (myProgress as any)?.completion_percent ?? 0;
                const exerciseCount = lesson.exercises.filter(e => e.type !== 'vocabulary_intro').length;
                return (
                  <Card
                    key={lesson.id}
                    className="hover:shadow-card transition-shadow cursor-pointer group"
                    tabIndex={0}
                    role="button"
                    aria-label={`${lesson.title} - ${lesson.level}`}
                    onClick={() => navigate(`/learn/${activeLanguageCode}/${lesson.level}/${lesson.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/learn/${activeLanguageCode}/${lesson.level}/${lesson.id}`)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{lesson.level}</Badge>
                        <span className="text-xs text-muted-foreground">+{lesson.xp} XP</span>
                      </div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{lesson.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {completionPct > 0 ? `${completionPct}%` : `${exerciseCount} ex`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Recent activity */}
      <section aria-label="Recent Activity">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recent Activity
        </h2>
        {!attempts?.length ? (
          <p className="text-sm text-muted-foreground py-4">No activity yet. Start a lesson to see your progress here.</p>
        ) : (
          <div className="space-y-2">
            {/* Group by lesson to show lessons taken */}
            {recentLessonIds.map((lessonId: string) => {
              const lessonAttempts = attempts.filter((a: any) => a.lesson_id === lessonId);
              const latest = lessonAttempts[0] as any;
              const title = latest?.lessons?.title || 'Exercise';
              const correctCount = lessonAttempts.filter((a: any) => a.correct).length;
              const accuracy = Math.round((correctCount / lessonAttempts.length) * 100);

              return (
                <div
                  key={lessonId}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accuracy >= 70 ? 'bg-primary/10' : 'bg-muted'}`}>
                    <BookOpen className={`w-4 h-4 ${accuracy >= 70 ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {correctCount}/{lessonAttempts.length} correct · {accuracy}% accuracy
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(latest.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => navigate(`/lessons/${lessonId}`)}
                      title="Review lesson"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
