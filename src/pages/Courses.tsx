import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { useCreateLanguageProfile, useDeleteLanguageProfile } from '@/hooks/useLanguageProfile';
import { getCefrLabels } from '@/hooks/useCourses';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';
import { useI18n } from '@/i18n';
import Header from '@/components/Header';
import { getCefrColor, mapEloToCefr } from '@/lib/elo';
import {
  GraduationCap, Loader2, BookOpen, Sparkles, ArrowRight,
  CheckCircle2, Lock, Play, Plus, Globe, Trash2, AlertTriangle,
} from 'lucide-react';
import type { CurriculumLesson } from '@/hooks/useCurriculumLessons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CoursesPage() {
  const { locale } = useI18n();
  const cefrLabels = getCefrLabels(locale);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [addLangOpen, setAddLangOpen] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: allLanguages } = useLanguages();

  const {
    activeProfile,
    activeLanguage,
    activeLanguageCode,
    setActiveProfileId,
    profiles,
    isLoading: profilesLoading,
  } = useActiveLanguage();

  const createProfile = useCreateLanguageProfile();
  const deleteProfile = useDeleteLanguageProfile();

  // Handle query params for level and auto-open add modal
  useEffect(() => {
    const qLevel = searchParams.get('level');
    const qAddLang = searchParams.get('addlang');
    if (qLevel) setSelectedLevel(qLevel);
    if (qAddLang === '1') setAddLangOpen(true);
  }, [searchParams]);

  // Reset selected level when language changes
  useEffect(() => {
    setSelectedLevel(null);
  }, [activeLanguageCode]);

  const { getLessonCompletion, isLessonComplete } = useCurriculumProgress();

  // Load ALL curriculum lessons for active language
  const { data: curriculumLessons, isLoading: lessonsLoading } = useCurriculumLessons(activeLanguageCode);

  // Show all lessons that have at least one exercise (including vocabulary_intro only)
  const validLessons = (curriculumLessons || []).filter(l => Array.isArray(l.exercises) && l.exercises.length > 0);

  const userLevel = activeProfile ? mapEloToCefr((activeProfile as any).overall_elo ?? 1000) : 'A1';
  const userLevelIndex = LEVELS.indexOf(userLevel);

  // Group lessons by level
  const lessonsByLevel = validLessons.reduce<Record<string, CurriculumLesson[]>>((acc, l) => {
    if (!acc[l.level]) acc[l.level] = [];
    acc[l.level].push(l);
    return acc;
  }, {});

  // Compute completion per level
  const levelStats = LEVELS.map((level, idx) => {
    const lessons = lessonsByLevel[level] || [];
    const completedCount = lessons.filter(l => isLessonComplete(l.id)).length;
    return {
      level,
      lessons,
      completedCount,
      totalCount: lessons.length,
      isUnlocked: idx <= userLevelIndex + 1,
      isComplete: lessons.length > 0 && completedCount >= lessons.length,
    };
  });

  const displayLevels = selectedLevel
    ? levelStats.filter(ls => ls.level === selectedLevel)
    : levelStats.filter(ls => ls.lessons.length > 0);

  const hasLessons = validLessons.length > 0;

  // Languages not yet enrolled
  const enrolledLangIds = new Set(profiles.map((p: any) => p.language_id));
  const unenrolledLanguages = (allLanguages || []).filter(l => !enrolledLangIds.has(l.id));

  const handleEnroll = async (languageId: string) => {
    setEnrollingId(languageId);
    try {
      const profile = await createProfile.mutateAsync(languageId);
      setActiveProfileId(profile.id);
      setAddLangOpen(false);
      toast.success('Language added! Start learning now.');
    } catch (e: any) {
      toast.error(e.message || 'Could not add language');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleDeleteLanguage = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProfile.mutateAsync(deleteTarget.id);
      // If the deleted profile was active, switch to another
      const remaining = profiles.filter((p: any) => p.id !== deleteTarget.id);
      if (remaining.length > 0) setActiveProfileId((remaining[0] as any).id);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} removed. All progress deleted.`);
    } catch (e: any) {
      toast.error(e.message || 'Could not remove language');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Courses</h1>
        </div>

        {/* No enrolled languages */}
        {profiles.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <Globe className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">No languages yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Add a language to start your learning path.
            </p>
            <Button onClick={() => setAddLangOpen(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Language
            </Button>
          </div>
        ) : (
          <>
            {/* My enrolled languages */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">My Languages</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddLangOpen(true)}
                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                >
                  <Plus className="w-3 h-3" /> Add language
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p: any) => {
                  const lang = p.languages;
                  if (!lang) return null;
                  const isSelected = activeLanguageCode === lang.code;
                  const langLevel = mapEloToCefr(p.overall_elo);
                  return (
                    <div
                      key={p.id}
                      className={`group flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-primary/30 bg-card'
                      }`}
                    >
                      <button onClick={() => setActiveProfileId(p.id)} className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag_emoji}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `hsl(${getCefrColor(langLevel)} / 0.15)`, color: `hsl(${getCefrColor(langLevel)})` }}
                        >
                          {langLevel}
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: p.id, name: lang.name })}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        title={`Remove ${lang.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected language content */}
            {activeLanguageCode && activeLanguage && (
              <div>
                {/* Language heading */}
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">{activeLanguage.flag_emoji} {activeLanguage.name}</h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `hsl(${getCefrColor(userLevel)} / 0.15)`, color: `hsl(${getCefrColor(userLevel)})` }}
                  >
                    Your level: {userLevel}
                  </span>
                </div>

                {/* Loading state for lessons */}
                {lessonsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !hasLessons ? (
                  <div className="text-center py-12 rounded-2xl border border-border/50 bg-card">
                    <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium mb-1">No lessons for {activeLanguage.name} yet.</p>
                    <p className="text-sm text-muted-foreground">More content coming soon!</p>
                  </div>
                ) : (
                  <>
                    {/* CEFR level tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <button
                        onClick={() => setSelectedLevel(null)}
                        className={`rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                          !selectedLevel ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 bg-card text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        All
                      </button>
                      {levelStats.filter(ls => ls.totalCount > 0).map(({ level, completedCount, totalCount, isUnlocked, isComplete }) => {
                        const color = getCefrColor(level);
                        const isSelected = selectedLevel === level;
                        return (
                          <button
                            key={level}
                            onClick={() => isUnlocked && setSelectedLevel(prev => prev === level ? null : level)}
                            disabled={!isUnlocked}
                            className={`relative flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : isUnlocked
                                ? 'border-border/50 bg-card hover:border-primary/30'
                                : 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <span style={{ color: `hsl(${color})` }}>{level}</span>
                            <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
                            {isComplete && <CheckCircle2 className="w-3 h-3 text-primary" />}
                            {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Lesson grid */}
                    {displayLevels.filter(ls => ls.lessons.length > 0).length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border border-border/50 bg-card">
                        <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No lessons for {selectedLevel ? `level ${selectedLevel}` : 'this language'} yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {displayLevels.filter(ls => ls.lessons.length > 0).map(({ level, lessons, completedCount, totalCount, isUnlocked, isComplete }) => (
                          <div key={level}>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                <span className="font-bold text-base" style={{ color: `hsl(${getCefrColor(level)})` }}>{level}</span>
                                <span className="text-muted-foreground">{cefrLabels[level]}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">{lessons.length} lessons</span>
                              </h3>
                              <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2">
                                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`, backgroundColor: `hsl(${getCefrColor(level)})` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
                                </div>
                                {isComplete && (
                                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {lessons.map((lesson, idx) => {
                                const completionPct = getLessonCompletion(lesson.id);
                                const isLessonDone = isLessonComplete(lesson.id);
                                const isLessonUnlocked = isUnlocked && (
                                  idx === 0 || isLessonComplete(lessons[idx - 1].id)
                                );
                                const exerciseCount = lesson.exercises.filter(e => e.type !== 'vocabulary_intro').length;
                                return (
                                  <CurriculumLessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    completionPct={completionPct}
                                    isComplete={isLessonDone}
                                    isUnlocked={isLessonUnlocked}
                                    exerciseCount={exerciseCount}
                                    langCode={activeLanguageCode}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Language Modal */}
      <Dialog open={addLangOpen} onOpenChange={setAddLangOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Add a Language
            </DialogTitle>
          </DialogHeader>

          {/* Already enrolled */}
          {profiles.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Currently Learning</p>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p: any) => {
                  const lang = p.languages;
                  if (!lang) return null;
                  return (
                    <span key={p.id} className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-sm">
                      <span>{lang.flag_emoji}</span>
                      <span className="font-medium">{lang.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available to add */}
          {unenrolledLanguages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p>You're learning all available languages!</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Available Languages</p>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {unenrolledLanguages.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => handleEnroll(lang.id)}
                    disabled={enrollingId === lang.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                  >
                    <span className="text-2xl">{lang.flag_emoji}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {enrollingId === lang.id && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Language Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Remove {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-medium text-foreground">⚠️ All your progress for {deleteTarget?.name} will be permanently deleted.</span>
              <br /><br />
              This includes all exercise attempts, skill ratings, and learning history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLanguage} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete & Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurriculumLessonCard({
  lesson, completionPct, isComplete, isUnlocked, exerciseCount, langCode,
}: {
  lesson: CurriculumLesson; completionPct: number; isComplete: boolean;
  isUnlocked: boolean; exerciseCount: number; langCode: string;
}) {
  const navigate = useNavigate();
  const cefrColor = getCefrColor(lesson.level);

  return (
    <div
      onClick={() => isUnlocked && navigate(`/learn/${langCode}/${lesson.level}/${lesson.id}`)}
      className={`group flex flex-col gap-3 rounded-xl border p-4 transition-all ${
        !isUnlocked
          ? 'border-border/30 bg-muted/30 opacity-60 cursor-not-allowed'
          : isComplete
          ? 'border-primary/30 bg-primary/5 hover:shadow-card cursor-pointer'
          : 'border-border/50 bg-card hover:shadow-card hover:border-primary/30 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm truncate ${isUnlocked ? 'group-hover:text-primary transition-colors' : ''}`}>
            {lesson.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lesson.description}</p>
        </div>
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        ) : !isUnlocked ? (
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
            style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}>
            {lesson.level}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${completionPct}%`, backgroundColor: `hsl(${cefrColor})` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{exerciseCount} exercises · {lesson.xp} XP</span>
        {isUnlocked && (
          <span className="flex items-center gap-1 text-primary font-medium">
            {isComplete ? <>Done <CheckCircle2 className="w-3 h-3" /></>
              : completionPct > 0 ? <><Play className="w-3 h-3" />{completionPct}%</>
              : <>Start <ArrowRight className="w-3 h-3" /></>}
          </span>
        )}
      </div>
    </div>
  );
}
