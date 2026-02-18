import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { useProgressStats, useRecentAttempts } from '@/hooks/useLearnerProgress';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { useSkillTrends } from '@/hooks/useDashboardStats';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';
import { useDescriptorProgressByLevel } from '@/hooks/useDescriptorProgress';
import EmptyState from '@/components/shared/EmptyState';
import SkeletonCard from '@/components/shared/SkeletonCard';
import SkillRatingsPanel from '@/components/dashboard/SkillRatingsPanel';
import CefrProgressBar from '@/components/dashboard/CefrProgressBar';
import DescriptorMasteryGrid from '@/components/dashboard/DescriptorMasteryGrid';
import type { DescriptorItem } from '@/components/dashboard/DescriptorMasteryGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Flame, Trophy, ArrowRight, Play,
  CheckCircle2, BarChart3, Clock, MessageCircle, RotateCcw, GraduationCap, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mapEloToCefr } from '@/lib/elo';
import { useState } from 'react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function LearnDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const {
    profiles,
    activeProfile,
    activeLanguage,
    activeLanguageCode,
    activeLanguageName,
    activeLanguageFlag,
    setActiveProfileId,
  } = useActiveLanguage();

  const { data: stats, isLoading: statsLoading } = useProgressStats(user?.id ?? null);
  const { data: attempts } = useRecentAttempts(user?.id ?? null, 10);
  const { data: skillTrends } = useSkillTrends(activeProfile?.id ?? null);
  const { data: descriptorsByLevel } = useDescriptorProgressByLevel(user?.id ?? null, activeProfile?.language_id);
  const { getLessonCompletion, isLessonComplete, completedCount: curriculumCompleted } = useCurriculumProgress();

  // Load all curriculum lessons for active language (all levels)
  const { data: curriculumLessons, isLoading: lessonsLoading } = useCurriculumLessons(activeLanguageCode);

  // Compute CEFR level statuses based on curriculum lesson completions
  const currentCefrLevel = activeProfile ? mapEloToCefr(activeProfile.overall_elo) : 'A1';
  const currentLevelIndex = LEVELS.indexOf(currentCefrLevel);

  const levelStatuses = LEVELS.map((level, idx) => {
    const lessonsAtLevel = (curriculumLessons || []).filter(l => l.level === level);
    const completedAtLevel = lessonsAtLevel.filter(l => isLessonComplete(l.id));
    return {
      level,
      totalLessons: lessonsAtLevel.length,
      completedLessons: completedAtLevel.length,
      isUnlocked: idx <= currentLevelIndex + 1,
    };
  });

  // Find next recommended lesson
  const nextLesson = (() => {
    for (const level of LEVELS) {
      const lessonsAtLevel = (curriculumLessons || []).filter(l => l.level === level);
      for (const lesson of lessonsAtLevel) {
        const pct = getLessonCompletion(lesson.id);
        if (pct < 100) return { lesson, pct };
      }
    }
    return null;
  })();

  // Continue lesson: most recent in-progress
  const continueLesson = (() => {
    const all = curriculumLessons || [];
    for (const lesson of all) {
      const pct = getLessonCompletion(lesson.id);
      if (pct > 0 && pct < 100) return { lesson, pct };
    }
    return null;
  })();

  // Recent curriculum lesson attempts grouped by lesson_id
  const recentLessonIds = [...new Set(attempts?.map((a: any) => a.lesson_id) ?? [])].slice(0, 5);

  // Build descriptor items per level from DB progress
  const getDescriptorsForLevel = (level: string): DescriptorItem[] => {
    if (!descriptorsByLevel || !descriptorsByLevel[level]) return [];
    return descriptorsByLevel[level].map((d: any) => ({
      id: d.descriptor_id,
      text: d.cefr_descriptors?.descriptor_text || '',
      level: d.cefr_descriptors?.level || level,
      scale: d.cefr_descriptors?.scale,
      status: d.status as DescriptorItem['status'],
    }));
  };

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
                <DropdownMenuItem onClick={() => navigate('/courses?addlang=1')} className="border-t mt-1 pt-2 text-primary">
                  <GraduationCap className="w-4 h-4 mr-2" /> Add a language
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/courses?addlang=1')}>
              <GraduationCap className="w-4 h-4 mr-1" /> Add language
            </Button>
          )}
        </div>
      )}

      {/* No language selected yet */}
      {profiles.length === 0 && !statsLoading && (
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
                <Trophy className="w-5 h-5 text-secondary" />
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
                <Flame className="w-5 h-5 text-accent" />
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
                <CheckCircle2 className="w-5 h-5 text-primary" />
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
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* CEFR Progress Bar */}
      {activeLanguageCode && !lessonsLoading && curriculumLessons && curriculumLessons.length > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <CefrProgressBar
              levelStatuses={levelStatuses}
              currentLevel={currentCefrLevel}
              onSelectLevel={(level) => navigate(`/courses?lang=${activeLanguageCode}&level=${level}`)}
            />
          </CardContent>
        </Card>
      )}

      {/* Continue / Next learning card */}
      {(continueLesson || nextLesson) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                {continueLesson ? (
                  <>
                    <p className="font-semibold">Continue Lesson</p>
                    <p className="text-sm text-muted-foreground">
                      {continueLesson.lesson.title} · {continueLesson.pct}%
                    </p>
                  </>
                ) : nextLesson ? (
                  <>
                    <p className="font-semibold">Next Up</p>
                    <p className="text-sm text-muted-foreground">
                      {nextLesson.lesson.title} · {nextLesson.lesson.level}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const target = continueLesson ?? nextLesson;
                if (target) {
                  navigate(`/learn/${activeLanguageCode}/${target.lesson.level}/${target.lesson.id}`);
                }
              }}
            >
              {continueLesson ? 'Resume' : 'Start'} <ArrowRight className="w-4 h-4" />
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
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate('/scenarios')}>
          <MessageCircle className="w-4 h-4 mr-1" /> Scenarios
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/skills')}>
          <BarChart3 className="w-4 h-4 mr-1" /> Skills
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
          <GraduationCap className="w-4 h-4 mr-1" /> All Courses
        </Button>
      </div>

      {/* Learning Path — grouped by CEFR level with descriptor mastery */}
      {activeLanguageCode && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Your Learning Path
            {activeLanguageFlag && <span>{activeLanguageFlag}</span>}
          </h2>

          {lessonsLoading ? (
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
            <div className="space-y-4">
              {LEVELS.map((level) => {
                const lessonsAtLevel = curriculumLessons.filter(l => l.level === level);
                if (!lessonsAtLevel.length) return null;

                const levelStatus = levelStatuses.find(ls => ls.level === level)!;
                const isComplete = levelStatus.completedLessons >= levelStatus.totalLessons && levelStatus.totalLessons > 0;
                const isExpanded = expandedLevel === level || level === currentCefrLevel;
                const descriptorsHere = getDescriptorsForLevel(level);

                return (
                  <div key={level} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    {/* Level header */}
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedLevel(isExpanded ? null : level)}
                    >
                      <div className="flex items-center gap-3">
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Badge variant="outline" className="text-xs font-bold px-2 py-0.5">{level}</Badge>
                        )}
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            {level} — {lessonsAtLevel.length} lessons
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {levelStatus.completedLessons}/{levelStatus.totalLessons} completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Mini progress */}
                        <div className="hidden sm:flex items-center gap-2 w-24">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${levelStatus.totalLessons > 0 ? Math.round((levelStatus.completedLessons / levelStatus.totalLessons) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border/50 p-4 space-y-4">
                        {/* Lessons grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {lessonsAtLevel.map((lesson) => {
                            const completionPct = getLessonCompletion(lesson.id);
                            const lessonDone = isLessonComplete(lesson.id);
                            const exerciseCount = lesson.exercises.filter(e => e.type !== 'vocabulary_intro').length;

                            return (
                              <div
                                key={lesson.id}
                                className={`rounded-xl border p-3 cursor-pointer hover:shadow-card transition-all group ${
                                  lessonDone
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'border-border/50 bg-background hover:border-primary/30'
                                }`}
                                tabIndex={0}
                                role="button"
                                aria-label={lesson.title}
                                onClick={() => navigate(`/learn/${activeLanguageCode}/${lesson.level}/${lesson.id}`)}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/learn/${activeLanguageCode}/${lesson.level}/${lesson.id}`)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                    {lesson.title}
                                  </p>
                                  {lessonDone && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{lesson.description}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                    {completionPct > 0 ? `${completionPct}%` : `${exerciseCount} ex`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Descriptor mastery for this level */}
                        {descriptorsHere.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <DescriptorMasteryGrid descriptors={descriptorsHere} level={level} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            {recentLessonIds.map((lessonId: string) => {
              const lessonAttempts = attempts.filter((a: any) => a.lesson_id === lessonId);
              const latest = lessonAttempts[0] as any;
              const title = latest?.lessons?.title || 'Exercise';
              const correctCount = lessonAttempts.filter((a: any) => a.correct).length;
              const accuracy = Math.round((correctCount / lessonAttempts.length) * 100);
              // Try to find curriculum lesson for this id to navigate properly
              const curriculumLesson = curriculumLessons?.find(l => l.id === lessonId);

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
                      onClick={() => {
                        if (curriculumLesson) {
                          navigate(`/learn/${activeLanguageCode}/${curriculumLesson.level}/${lessonId}`);
                        } else {
                          navigate(`/lessons/${lessonId}`);
                        }
                      }}
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
