import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { getCefrLabels } from '@/hooks/useCourses';
import { useCurriculumLessons, CurriculumLesson } from '@/hooks/useCurriculumLessons';
import { useI18n } from '@/i18n';
import Header from '@/components/Header';
import CefrLevelGrid from '@/components/courses/CefrLevelGrid';
import { getCefrColor, mapEloToCefr } from '@/lib/elo';
import {
  GraduationCap, Loader2, BookOpen, Sparkles, Target, ArrowRight, CheckCircle2,
} from 'lucide-react';

export default function CoursesPage() {
  const { locale, t } = useI18n();
  const cefrLabels = getCefrLabels(locale);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: languages, isLoading: langsLoading } = useLanguages();
  const {
    activeProfile,
    activeLanguage,
    setActiveProfileId,
    profiles,
  } = useActiveLanguage();

  // Auto-select the active language on mount
  useEffect(() => {
    if (activeLanguage && !selectedLangId) {
      const lang = languages?.find(l => l.code === activeLanguage.code);
      if (lang) setSelectedLangId(lang.id);
    }
  }, [activeLanguage, languages, selectedLangId]);

  const selectedLang = languages?.find(l => l.id === selectedLangId);
  // Use profile for the selected language
  const profile = profiles?.find((p: any) => p.languages?.id === selectedLangId) ?? activeProfile;

  // Load curriculum lessons from JSON files
  const { data: curriculumLessons, isLoading: lessonsLoading } = useCurriculumLessons(
    selectedLang?.code ?? null,
    selectedLevel ?? undefined
  );

  // Auto-select user's CEFR level
  useEffect(() => {
    if (profile && !selectedLevel) {
      setSelectedLevel(mapEloToCefr(profile.overall_elo));
    }
  }, [profile, selectedLevel]);

  useEffect(() => {
    setSelectedLevel(null);
  }, [selectedLangId]);

  const userLevel = profile ? mapEloToCefr(profile.overall_elo) : null;

  // Group by level
  const lessonsByLevel = (curriculumLessons || []).reduce<Record<string, CurriculumLesson[]>>((acc, l) => {
    if (!acc[l.level]) acc[l.level] = [];
    acc[l.level].push(l);
    return acc;
  }, {});

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const displayLevels = selectedLevel
    ? [{ level: selectedLevel, lessons: lessonsByLevel[selectedLevel] || [] }]
    : levels.map(l => ({ level: l, lessons: lessonsByLevel[l] || [] })).filter(g => g.lessons.length > 0);

  const totalLessons = displayLevels.reduce((s, l) => s + l.lessons.length, 0);

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
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">{t('nav.courses')}</h1>
        </div>

        {/* Language grid - enrolled languages first */}
        <div className="mb-8">
          {profiles.length > 0 && (
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Your languages</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
            {languages?.map(lang => {
              const isSelected = selectedLangId === lang.id;
              const isEnrolled = profiles.some((p: any) => p.languages?.code === lang.code);
              return (
                <button key={lang.id} onClick={() => setSelectedLangId(lang.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all cursor-pointer relative ${
                    isSelected ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/50 hover:border-primary/30 bg-card'
                  }`}>
                  <span className="text-2xl">{lang.flag_emoji}</span>
                  <span className="text-xs font-medium truncate w-full text-center">{lang.name}</span>
                  {isEnrolled && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" title="Enrolled" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected language content */}
        {selectedLangId && selectedLang && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{selectedLang.flag_emoji} {selectedLang.name}</h2>
              {userLevel && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md ml-2"
                  style={{ backgroundColor: `hsl(${getCefrColor(userLevel)} / 0.15)`, color: `hsl(${getCefrColor(userLevel)})` }}>
                  <Target className="w-3 h-3 inline mr-1" />
                  {locale === 'sv' ? 'Din nivå' : 'Your level'}: {userLevel}
                </span>
              )}
            </div>

            <div className="mb-6">
              <CefrLevelGrid selectedLevel={selectedLevel}
                onSelectLevel={level => setSelectedLevel(prev => prev === level ? null : level)}
                userElo={profile?.overall_elo} />
            </div>

            {lessonsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : totalLessons > 0 ? (
              <div className="space-y-6">
                {displayLevels.map(({ level, lessons }) => (
                  <div key={level}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="font-bold" style={{ color: `hsl(${getCefrColor(level)})` }}>{level}</span>
                      {cefrLabels[level]} – {lessons.length} {locale === 'sv' ? 'lektioner' : 'lessons'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lessons.map(lesson => (
                        <CurriculumLessonCard key={lesson.id} lesson={lesson} />
                      ))}
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
        )}

        {!selectedLangId && (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{locale === 'sv' ? 'Välj ett språk ovan' : 'Select a language above to start'}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CurriculumLessonCard({ lesson }: { lesson: CurriculumLesson }) {
  const cefrColor = getCefrColor(lesson.level);
  const exerciseCount = lesson.exercises.filter(e => e.type !== 'vocabulary_intro').length;

  return (
    <Link to={`/learn/${lesson.language}/${lesson.level}/${lesson.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-card hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {lesson.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lesson.description}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
          style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}>
          {lesson.level}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{exerciseCount} exercises</span>
        <span className="flex items-center gap-1 text-primary font-medium">
          +{lesson.xp} XP <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
