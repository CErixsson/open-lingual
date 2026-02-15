import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useLanguageProfile } from '@/hooks/useLanguageProfile';
import {
  useLessonsByLanguageCode,
  groupLessonsByCefr,
  CEFR_LABELS,
} from '@/hooks/useCourses';
import Header from '@/components/Header';
import CefrLevelGrid from '@/components/courses/CefrLevelGrid';
import LessonCard from '@/components/courses/LessonCard';
import { getCefrColor, mapEloToCefr } from '@/lib/elo';
import {
  GraduationCap,
  Loader2,
  BookOpen,
  Sparkles,
  Target,
} from 'lucide-react';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: languages, isLoading: langsLoading } = useLanguages();
  const selectedLang = languages?.find(l => l.id === selectedLangId);
  const { data: profile } = useLanguageProfile(selectedLangId);
  const { data: lessons, isLoading: lessonsLoading } = useLessonsByLanguageCode(selectedLang?.code ?? null);

  // Auto-select user's CEFR level when profile loads
  useEffect(() => {
    if (profile && !selectedLevel) {
      const userLevel = mapEloToCefr(profile.overall_elo);
      setSelectedLevel(userLevel);
    }
  }, [profile, selectedLevel]);

  // Reset level selection when language changes
  useEffect(() => {
    setSelectedLevel(null);
  }, [selectedLangId]);

  const lessonLevels = lessons ? groupLessonsByCefr(lessons) : [];
  const filteredLessons = selectedLevel
    ? lessonLevels.find(l => l.level === selectedLevel)?.lessons ?? []
    : lessonLevels.flatMap(l => l.lessons);

  const userLevel = profile ? mapEloToCefr(profile.overall_elo) : null;

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
          <h1 className="text-2xl font-bold">Kurser</h1>
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 mb-8">
          {languages?.map(lang => {
            const isSelected = selectedLangId === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLangId(lang.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-soft'
                    : 'border-border/50 hover:border-primary/30 bg-card'
                }`}
              >
                <span className="text-2xl">{lang.flag_emoji}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {lang.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected language content */}
        {selectedLangId && selectedLang && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">
                {selectedLang.flag_emoji} {selectedLang.name}
              </h2>
              {userLevel && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md ml-2"
                  style={{
                    backgroundColor: `hsl(${getCefrColor(userLevel)} / 0.15)`,
                    color: `hsl(${getCefrColor(userLevel)})`,
                  }}
                >
                  <Target className="w-3 h-3 inline mr-1" />
                  Din nivå: {userLevel}
                </span>
              )}
            </div>

            {/* CEFR Level Grid - Lichess-inspired */}
            <div className="mb-6">
              <CefrLevelGrid
                selectedLevel={selectedLevel}
                onSelectLevel={level => setSelectedLevel(prev => prev === level ? null : level)}
                userElo={profile?.overall_elo}
              />
            </div>

            {/* Recommended / Filtered lessons */}
            {lessonsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLessons.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  {selectedLevel ? (
                    <>
                      <span
                        className="font-bold"
                        style={{ color: `hsl(${getCefrColor(selectedLevel)})` }}
                      >
                        {selectedLevel}
                      </span>
                      {CEFR_LABELS[selectedLevel]} – {filteredLessons.length} lektioner
                    </>
                  ) : (
                    <>Alla lektioner – {filteredLessons.length} st</>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLessons.map((lesson: any) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border border-border/50 bg-card">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Inga lektioner för {selectedLevel ? `nivå ${selectedLevel}` : 'detta språk'} ännu.
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedLangId && (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Välj ett språk ovan för att se tillgängliga kurser</p>
          </div>
        )}
      </main>
    </div>
  );
}
