import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useLanguageProfile, useCreateLanguageProfile } from '@/hooks/useLanguageProfile';
import { useCefrBands } from '@/hooks/useLanguages';
import { useDashboardStats, useSkillTrends } from '@/hooks/useDashboardStats';
import { useProgressHistory, usePeriodComparison } from '@/hooks/useProgressHistory';
import { useCoachingInsights } from '@/hooks/useCoachingInsights';
import { useDailyFocus } from '@/hooks/useDailyFocus';
import { useRecommendedExercises } from '@/hooks/useExercises';


import Header from '@/components/Header';
import LanguageSelector from '@/components/elo/LanguageSelector';
import RatingChip from '@/components/elo/RatingChip';
import ExerciseCard from '@/components/elo/ExerciseCard';
import AtAGlanceSummary from '@/components/dashboard/AtAGlanceSummary';
import EnhancedSkillsGrid from '@/components/dashboard/EnhancedSkillsGrid';
import ProgressChart from '@/components/dashboard/ProgressChart';
import CoachingPanel from '@/components/dashboard/CoachingPanel';
import DailyFocusCard from '@/components/dashboard/DailyFocusCard';

import { Flame, Target, BarChart3, Loader2, Brain, Crosshair, LineChart } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: languages, isLoading: langsLoading } = useLanguages();
  const { data: profile, isLoading: profileLoading } = useLanguageProfile(selectedLanguageId);
  const { data: bands } = useCefrBands(selectedLanguageId);

  // Enhanced data hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats(profile?.id ?? null);
  const { data: skillTrends, isLoading: trendsLoading } = useSkillTrends(profile?.id ?? null);
  const { data: history, isLoading: historyLoading } = useProgressHistory(profile?.id ?? null, 30);
  const { data: comparison } = usePeriodComparison(profile?.id ?? null, 7);
  const { data: insights, isLoading: insightsLoading } = useCoachingInsights(
    profile?.id ?? null,
    skillTrends,
    profile?.overall_elo
  );
  const dailyFocus = useDailyFocus(skillTrends);
  const { data: exercises, isLoading: exercisesLoading } = useRecommendedExercises(
    selectedLanguageId,
    profile?.overall_elo
  );

  const createProfile = useCreateLanguageProfile();

  // Auto-select first language
  useEffect(() => {
    if (languages?.length && !selectedLanguageId) {
      setSelectedLanguageId(languages[0].id);
    }
  }, [languages, selectedLanguageId]);

  const handleSelectLanguage = async (langId: string) => {
    setSelectedLanguageId(langId);
  };

  const handleStartLanguage = async () => {
    if (!selectedLanguageId) return;
    try {
      await createProfile.mutateAsync(selectedLanguageId);
      toast.success('Språkprofil skapad! Dags att börja träna.');
    } catch {
      toast.error('Kunde inte skapa profil.');
    }
  };

  if (authLoading || langsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cefrBands = bands?.map(b => ({
    level: b.level,
    band_min: b.band_min,
    band_max: b.band_max,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl space-y-6">
        {/* Top bar: Language selector + rating */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <LanguageSelector
                languages={languages || []}
                selectedId={selectedLanguageId}
                onSelect={handleSelectLanguage}
              />
              {profile && (
                <RatingChip
                  elo={profile.overall_elo}
                  rd={profile.overall_rd}
                  bands={cefrBands}
                  showProgress
                  size="lg"
                />
              )}
            </div>
            {profile && (
              <div className="flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5 text-secondary">
                  <Flame className="w-5 h-5" />
                  <span className="font-bold tabular-nums">{profile.streak_count}</span>
                  <span className="text-muted-foreground text-xs">streak</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="tabular-nums">{profile.total_attempts} försök</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No profile yet – onboarding */}
        {!profileLoading && !profile && selectedLanguageId && (
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card text-center">
            <h2 className="text-xl font-bold mb-2">
              Börja lära dig{' '}
              {languages?.find(l => l.id === selectedLanguageId)?.name || 'detta språk'}!
            </h2>
            <p className="text-muted-foreground mb-4">
              Din Elo startar på 1000 (A2). Gör övningar för att klättra i CEFR-nivåerna.
            </p>
            <button
              onClick={handleStartLanguage}
              disabled={createProfile.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Starta profil
            </button>
          </div>
        )}

        {/* === DASHBOARD SECTIONS (only when profile exists) === */}
        {profile && (
          <>
            {/* 1. At-a-Glance Summary */}
            <AtAGlanceSummary
              overallElo={profile.overall_elo}
              overallCefr={profile.overall_cefr}
              streak={profile.streak_count}
              stats={stats}
              isLoading={statsLoading}
            />

            {/* 2. Skill Ratings with trends */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Färdigheter</h2>
              </div>
              {trendsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <EnhancedSkillsGrid
                  trends={skillTrends || []}
                  bands={cefrBands}
                />
              )}
            </section>

            {/* 3. Progress Visualization */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Progression</h2>
              </div>
              <ProgressChart
                history={history || []}
                comparison={comparison}
                bands={cefrBands}
                isLoading={historyLoading}
              />
            </section>

            {/* 4. Two-column: Coaching + Daily Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coaching insights */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold">Coaching</h2>
                </div>
                <CoachingPanel insights={insights} isLoading={insightsLoading} />
              </section>

              {/* Daily focus */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Crosshair className="w-5 h-5 text-secondary" />
                  <h2 className="text-lg font-bold">Dagens fokus</h2>
                </div>
                <DailyFocusCard focus={dailyFocus} languageId={selectedLanguageId} />
              </section>
            </div>

            {/* 5. Recommended exercises */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold">Rekommenderade övningar</h2>
              </div>
              {exercisesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : exercises?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exercises.map((ex: any) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground rounded-xl border border-border/50 bg-card">
                  Inga övningar tillgängliga just nu för din nivå.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
