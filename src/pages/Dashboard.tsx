import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';
import { useCefrBands } from '@/hooks/useLanguages';
import { useDashboardStats, useSkillTrends } from '@/hooks/useDashboardStats';
import { useProgressHistory, usePeriodComparison } from '@/hooks/useProgressHistory';
import { useCoachingInsights } from '@/hooks/useCoachingInsights';
import { useDailyFocus } from '@/hooks/useDailyFocus';
import { useRecommendedExercises } from '@/hooks/useExercises';

import Header from '@/components/Header';
import RatingChip from '@/components/elo/RatingChip';
import ExerciseCard from '@/components/elo/ExerciseCard';
import AtAGlanceSummary from '@/components/dashboard/AtAGlanceSummary';
import EnhancedSkillsGrid from '@/components/dashboard/EnhancedSkillsGrid';
import ProgressChart from '@/components/dashboard/ProgressChart';
import CoachingPanel from '@/components/dashboard/CoachingPanel';
import DailyFocusCard from '@/components/dashboard/DailyFocusCard';

import { Flame, Target, BarChart3, Loader2, Brain, Crosshair, LineChart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Use the shared active language context — same as the learner dashboard
  const {
    activeProfile,
    activeLanguage,
    activeLanguageCode,
    activeLanguageName,
    activeLanguageFlag,
    isLoading: profilesLoading,
  } = useActiveLanguage();

  const selectedLanguageId = activeLanguage?.id ?? null;

  const { data: bands } = useCefrBands(selectedLanguageId || undefined);

  const { data: stats, isLoading: statsLoading } = useDashboardStats(activeProfile?.id || undefined);
  const { data: skillTrends, isLoading: trendsLoading } = useSkillTrends(activeProfile?.id || undefined);
  const { data: history, isLoading: historyLoading } = useProgressHistory(activeProfile?.id || undefined, 30);
  const { data: comparison, isLoading: comparisonLoading } = usePeriodComparison(activeProfile?.id || undefined, 7);
  const { data: insights, isLoading: insightsLoading } = useCoachingInsights(
    activeProfile?.id || undefined,
    skillTrends && skillTrends.length > 0 ? skillTrends : undefined,
    activeProfile?.overall_elo || undefined
  );
  const dailyFocus = useDailyFocus(skillTrends ?? []);
  const { data: exercises, isLoading: exercisesLoading } = useRecommendedExercises(
    selectedLanguageId || undefined,
    activeProfile?.overall_elo || undefined
  );

  if (authLoading || profilesLoading) {
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
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl space-y-6">

        {/* Back + active language header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          {activeLanguageFlag && (
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="text-xl">{activeLanguageFlag}</span>
              {activeLanguageName}
            </span>
          )}
          {activeProfile && (
            <RatingChip
              elo={activeProfile.overall_elo}
              rd={activeProfile.overall_rd}
              bands={cefrBands}
              showProgress
              size="lg"
            />
          )}
          {activeProfile && (
            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-secondary">
                <Flame className="w-4 h-4" />
                <span className="font-bold tabular-nums">{activeProfile.streak_count ?? 0}</span>
                <span className="text-muted-foreground text-xs">streak</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span className="tabular-nums">{activeProfile.total_attempts ?? 0} attempts</span>
              </div>
            </div>
          )}
        </div>

        {/* No profile */}
        {!activeProfile && (
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card text-center">
            <p className="text-muted-foreground mb-4">No language selected. Go to the dashboard to pick a language.</p>
            <Button onClick={() => navigate('/dashboard')}>← Back to Dashboard</Button>
          </div>
        )}

        {activeProfile && (
          <>
            {/* At-a-Glance */}
            <AtAGlanceSummary
              overallElo={activeProfile.overall_elo}
              overallCefr={activeProfile.overall_cefr}
              streak={activeProfile.streak_count ?? 0}
              stats={stats}
              isLoading={statsLoading}
            />

            {/* Skills */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Skills</h2>
              </div>
              {trendsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : skillTrends && skillTrends.length > 0 ? (
                <EnhancedSkillsGrid trends={skillTrends} bands={cefrBands} />
              ) : (
                <div className="text-center py-8 text-muted-foreground rounded-xl border border-border/50 bg-card">
                  No skill data yet. Complete some exercises to see your ratings.
                </div>
              )}
            </section>

            {/* Progress chart */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Progress</h2>
              </div>
              <ProgressChart
                history={history || []}
                comparison={comparison || undefined}
                bands={cefrBands}
                isLoading={historyLoading || comparisonLoading}
              />
            </section>

            {/* Coaching + Daily Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold">Coaching</h2>
                </div>
                <CoachingPanel insights={insights} isLoading={insightsLoading} />
              </section>
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Crosshair className="w-5 h-5 text-secondary" />
                  <h2 className="text-lg font-bold">Daily Focus</h2>
                </div>
                <DailyFocusCard focus={dailyFocus} languageId={selectedLanguageId || ''} />
              </section>
            </div>

            {/* Recommended exercises */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold">Recommended Exercises</h2>
              </div>
              {exercisesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : exercises && exercises.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exercises.map((ex) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground rounded-xl border border-border/50 bg-card">
                  No exercises available for your level yet.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
