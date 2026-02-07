import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import {
  useExercisesByLanguage,
  useExerciseCountsByLanguage,
  groupExercisesByCefr,
  CEFR_LABELS,
} from '@/hooks/useCourses';
import Header from '@/components/Header';
import ExerciseCard from '@/components/elo/ExerciseCard';
import { getCefrColor } from '@/lib/elo';
import {
  BookOpen,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['A1', 'A2']));
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: languages, isLoading: langsLoading } = useLanguages();
  const { data: counts } = useExerciseCountsByLanguage();
  const { data: exercises, isLoading: exLoading, refetch } = useExercisesByLanguage(selectedLangId);

  const courseLevels = exercises ? groupExercisesByCefr(exercises) : [];

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!selectedLangId || !languages) return;
    const lang = languages.find(l => l.id === selectedLangId);
    if (!lang) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-courses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            languageId: lang.id,
            languageCode: lang.code,
            languageName: lang.name,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed');

      if (result.created > 0) {
        toast.success(`${result.created} nya övningar skapade för ${lang.name}!`);
        refetch();
      } else {
        toast.info(result.message || `${lang.name} har redan övningar.`);
      }
    } catch (err: any) {
      toast.error('Kunde inte generera övningar: ' + (err.message || ''));
    } finally {
      setGenerating(false);
    }
  };

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
            const exerciseCount = counts?.[lang.id] || 0;
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
                <span className="text-xs text-muted-foreground tabular-nums">
                  {exerciseCount} övn.
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected language content */}
        {selectedLangId && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {languages?.find(l => l.id === selectedLangId)?.flag_emoji}{' '}
                {languages?.find(l => l.id === selectedLangId)?.name} – CEFR-kurser
              </h2>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? 'Genererar…' : 'Generera övningar med AI'}
              </Button>
            </div>

            {exLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : courseLevels.length > 0 ? (
              <div className="space-y-4">
                {courseLevels.map(({ level, exercises: levelExercises }) => {
                  const cefrColor = getCefrColor(level);
                  const isExpanded = expandedLevels.has(level);

                  return (
                    <div
                      key={level}
                      className="rounded-2xl border border-border/50 bg-card shadow-soft overflow-hidden"
                    >
                      <button
                        onClick={() => toggleLevel(level)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-bold px-2.5 py-1 rounded-lg"
                            style={{
                              backgroundColor: `hsl(${cefrColor} / 0.15)`,
                              color: `hsl(${cefrColor})`,
                            }}
                          >
                            {level}
                          </span>
                          <span className="font-semibold">{CEFR_LABELS[level]}</span>
                          <span className="text-sm text-muted-foreground">
                            {levelExercises.length} övningar
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {levelExercises.map(ex => (
                              <ExerciseCard key={ex.id} exercise={ex as any} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border border-border/50 bg-card">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Inga övningar för detta språk ännu.
                </p>
                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generera CEFR-kurser med AI
                </Button>
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
