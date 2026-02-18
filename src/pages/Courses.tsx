import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { getCefrLabels } from '@/hooks/useCourses';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';
import { useMyProgress } from '@/hooks/useLearnerProgress';
import { useI18n } from '@/i18n';
import Header from '@/components/Header';
import CefrLevelGrid from '@/components/courses/CefrLevelGrid';
import { getCefrColor, mapEloToCefr } from '@/lib/elo';
import {
  GraduationCap, Loader2, BookOpen, Sparkles, Target, ArrowRight, CheckCircle2, Lock, Play,
} from 'lucide-react';
import type { CurriculumLesson } from '@/hooks/useCurriculumLessons';
import { Badge } from '@/components/ui/badge';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CoursesPage() {
  const { locale, t } = useI18n();
  const cefrLabels = getCefrLabels(locale);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedLangCode, setSelectedLangCode] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: languages, isLoading: langsLoading } = useLanguages();
  const {
    activeProfile,
    activeLanguage,
    activeLanguageCode,
    setActiveProfileId,
    profiles,
  } = useActiveLanguage();

  // Auto-select the active language on mount (or from query param)
  useEffect(() => {
    const qLang = searchParams.get('lang');
    const qLevel = searchParams.get('level');
    if (qLang) { setSelectedLangCode(qLang); }
    else if (activeLanguageCode && !selectedLangCode) { setSelectedLangCode(activeLanguageCode); }
    if (qLevel) setSelectedLevel(qLevel);
  }, [activeLanguageCode, searchParams]);

  const selectedLang = languages?.find(l => l.code === selectedLangCode);
  // Profile for selected language
  const profile = profiles?.find((p: any) => p.languages?.code === selectedLangCode) ?? activeProfile;

  // Load ALL curriculum lessons for selected language
  const { data: curriculumLessons, isLoading: lessonsLoading } = useCurriculumLessons(selectedLangCode);
  const { data: progress } = useMyProgress(user?.id ?? null);

  // Auto-select user's CEFR level for selected language
  useEffect(() => {
    if (profile && !selectedLevel && !searchParams.get('level')) {
      setSelectedLevel(mapEloToCefr(profile.overall_elo));
    }
  }, [profile, selectedLevel]);

  useEffect(() => {
    setSelectedLevel(null);
  }, [selectedLangCode]);

  const userLevel = profile ? mapEloToCefr(profile.overall_elo) : 'A1';
  const userLevelIndex = LEVELS.indexOf(userLevel);

  // Group lessons by level
  const lessonsByLevel = (curriculumLessons || []).reduce<Record<string, CurriculumLesson[]>>((acc, l) => {
    if (!acc[l.level]) acc[l.level] = [];
    acc[l.level].push(l);
    return acc;
  }, {});

  // Compute completion per level
  const levelStats = LEVELS.map((level, idx) => {
    const lessons = lessonsByLevel[level] || [];
    const completed = lessons.filter(l => {
      const p = progress?.find((p: any) => p.lesson_id === l.id);
      return (p as any)?.completion_percent >= 100;
    });
    return {
      level,
      lessons,
      completedCount: completed.length,
      totalCount: lessons.length,
      isUnlocked: idx <= userLevelIndex + 1,
      isComplete: lessons.length > 0 && completed.length >= lessons.length,
    };
  });

  // Display: filter by selected level or show all with lessons
  const displayLevels = selectedLevel
    ? levelStats.filter(ls => ls.level === selectedLevel)
    : levelStats.filter(ls => ls.lessons.length > 0);

  if (authLoading || langsLoading) {
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
          <h1 className="text-2xl font-bold">{t('nav.courses')}</h1>
        </div>

        {/* Language selector — compact flag grid */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            {profiles.length > 0 ? 'Your Languages' : 'Select a Language'}
          </p>
          <div className="flex flex-wrap gap-2">
            {languages?.map(lang => {
              const isSelected = selectedLangCode === lang.code;
              const isEnrolled = profiles.some((p: any) => p.languages?.code === lang.code);
              const langProfile = profiles.find((p: any) => p.languages?.code === lang.code);
              const langLevel = langProfile ? mapEloToCefr(langProfile.overall_elo) : null;
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLangCode(lang.code);
                    // Switch active profile if enrolled
                    if (langProfile) setActiveProfileId(langProfile.id);
                  }}
                  className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-border/50 hover:border-primary/30 bg-card'
                  }`}
                >
                  <span className="text-lg">{lang.flag_emoji}</span>
                  <span className="text-xs font-medium">{lang.name}</span>
                  {langLevel && isEnrolled && (
                    <span className="text-[10px] font-bold text-muted-foreground">{langLevel}</span>
                  )}
                  {isEnrolled && (
                    <span className="w-2 h-2 rounded-full bg-primary absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected language content */}
        {selectedLangCode && selectedLang ? (
          <div>
            {/* Language heading + level indicator */}
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{selectedLang.flag_emoji} {selectedLang.name}</h2>
              {userLevel && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `hsl(${getCefrColor(userLevel)} / 0.15)`, color: `hsl(${getCefrColor(userLevel)})` }}
                >
                  <Target className="w-3 h-3 inline mr-1" />
                  {locale === 'sv' ? 'Din nivå' : 'Your level'}: {userLevel}
                </span>
              )}
            </div>

            {/* CEFR level selector with progress dots */}
            <div className="mb-6">
              <CefrLevelGrid
                selectedLevel={selectedLevel}
                onSelectLevel={level => setSelectedLevel(prev => prev === level ? null : level)}
                userElo={profile?.overall_elo}
              />
            </div>

            {/* Level overview progress bar */}
            {!selectedLevel && curriculumLessons && curriculumLessons.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
                {levelStats.filter(ls => ls.totalCount > 0).map(({ level, completedCount, totalCount, isUnlocked, isComplete }) => {
                  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  const color = getCefrColor(level);
                  return (
                    <button
                      key={level}
                      onClick={() => isUnlocked && setSelectedLevel(level)}
                      disabled={!isUnlocked}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-all ${
                        isUnlocked ? 'bg-card hover:border-primary/30 cursor-pointer' : 'bg-muted/30 opacity-50 cursor-not-allowed'
                      } ${isComplete ? 'border-primary/30' : 'border-border/50'}`}
                    >
                      <span className="font-bold" style={{ color: `hsl(${color})` }}>{level}</span>
                      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: `hsl(${color})` }} />
                      </div>
                      <span className="text-muted-foreground tabular-nums">{completedCount}/{totalCount}</span>
                      {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      {isComplete && <CheckCircle2 className="w-3 h-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {lessonsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayLevels.some(ls => ls.lessons.length > 0) ? (
              <div className="space-y-8">
                {displayLevels.filter(ls => ls.lessons.length > 0).map(({ level, lessons, completedCount, totalCount, isUnlocked, isComplete }) => (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="font-bold text-base" style={{ color: `hsl(${getCefrColor(level)})` }}>{level}</span>
                        <span className="text-muted-foreground">{cefrLabels[level]}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{lessons.length} {locale === 'sv' ? 'lektioner' : 'lessons'}</span>
                      </h3>
                      {isComplete && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </span>
                      )}
                    </div>
                    {/* Sequential lesson path */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lessons.map((lesson, idx) => {
                        const p = progress?.find((p: any) => p.lesson_id === lesson.id);
                        const completionPct = (p as any)?.completion_percent ?? 0;
                        const isLessonComplete = completionPct >= 100;
                        const isLessonUnlocked = isUnlocked && (idx === 0 || (() => {
                          const prevLesson = lessons[idx - 1];
                          const prevP = progress?.find((pr: any) => pr.lesson_id === prevLesson.id);
                          return ((prevP as any)?.completion_percent ?? 0) >= 100;
                        })());
                        const exerciseCount = lesson.exercises.filter(e => e.type !== 'vocabulary_intro').length;
                        return (
                          <CurriculumLessonCard
                            key={lesson.id}
                            lesson={lesson}
                            completionPct={completionPct}
                            isComplete={isLessonComplete}
                            isUnlocked={isLessonUnlocked}
                            exerciseCount={exerciseCount}
                            langCode={selectedLangCode}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border border-border/50 bg-card">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {locale === 'sv'
                    ? `Inga lektioner för ${selectedLevel ? `nivå ${selectedLevel}` : 'detta språk'} ännu.`
                    : `No lessons for ${selectedLevel ? `level ${selectedLevel}` : 'this language'} yet.`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{locale === 'sv' ? 'Välj ett språk ovan' : 'Select a language above to start'}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CurriculumLessonCard({
  lesson,
  completionPct,
  isComplete,
  isUnlocked,
  exerciseCount,
  langCode,
}: {
  lesson: CurriculumLesson;
  completionPct: number;
  isComplete: boolean;
  isUnlocked: boolean;
  exerciseCount: number;
  langCode: string;
}) {
  const navigate = useNavigate();
  const cefrColor = getCefrColor(lesson.level);

  const handleClick = () => {
    if (isUnlocked) navigate(`/learn/${langCode}/${lesson.level}/${lesson.id}`);
  };

  return (
    <div
      onClick={handleClick}
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
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
            style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}
          >
            {lesson.level}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${completionPct}%`, backgroundColor: `hsl(${cefrColor})` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{exerciseCount} exercises</span>
        {isUnlocked && (
          <span className="flex items-center gap-1 text-primary font-medium">
            {isComplete ? (
              <>Done · +{lesson.xp} XP</>
            ) : completionPct > 0 ? (
              <><Play className="w-3 h-3" />{completionPct}%</>
            ) : (
              <>+{lesson.xp} XP <ArrowRight className="w-3 h-3" /></>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
