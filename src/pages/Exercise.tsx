import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExercise } from '@/hooks/useExercises';
import { useSubmitAttempt, type AttemptResult } from '@/hooks/useSubmitAttempt';
import RatingChip from '@/components/elo/RatingChip';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Loader2,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: exercise, isLoading } = useExercise(id ?? null);
  const submitAttempt = useSubmitAttempt();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [startTime]);

  const content = exercise?.content as {
    type: string;
    question: string;
    options: string[];
    correctIndex: number;
  } | null;

  const handleSubmit = async () => {
    if (selectedAnswer === null || !exercise) return;
    clearInterval(timerRef.current);

    try {
      const res = await submitAttempt.mutateAsync({
        exerciseId: exercise.id,
        answer: selectedAnswer,
        timeSpentSec: elapsed,
      });
      setResult(res);

      if (res.overallCefr !== res.previousCefr) {
        toast.success(`🎉 Nivå upp: ${res.overallCefr}!`);
      }
    } catch {
      toast.error('Kunde inte skicka svaret.');
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exercise || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Övningen hittades inte.</p>
          <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            ← Tillbaka till Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const isCorrect = selectedAnswer === content.correctIndex;
  const eloDelta = result ? result.skillRating.eloAfter - result.skillRating.eloBefore : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        {/* Exercise header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{exercise.title}</h1>
            <p className="text-sm text-muted-foreground">
              {(exercise.skills as any)?.display_name} · Elo {exercise.difficulty_elo}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="tabular-nums">{elapsed}s</span>
            {exercise.time_limit_sec && (
              <span className="text-xs">/ {exercise.time_limit_sec}s</span>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold mb-6">{content.question}</h2>

          <div className="grid gap-3">
            {content.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const showCorrect = result && idx === content.correctIndex;
              const showWrong = result && isSelected && idx !== content.correctIndex;

              return (
                <button
                  key={idx}
                  onClick={() => !result && setSelectedAnswer(idx)}
                  disabled={!!result}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    showCorrect
                      ? 'border-primary bg-primary/5'
                      : showWrong
                      ? 'border-destructive bg-destructive/5'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                  } ${result ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      showCorrect
                        ? 'bg-primary text-primary-foreground'
                        : showWrong
                        ? 'bg-destructive text-destructive-foreground'
                        : isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium">{option}</span>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                  {showWrong && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit / Results */}
        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || submitAttempt.isPending}
            className="w-full h-12 text-base"
          >
            {submitAttempt.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Svara
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Result feedback */}
            <div
              className={`rounded-2xl p-6 text-center ${
                isCorrect
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-destructive/10 border border-destructive/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {isCorrect ? (
                  <Trophy className="w-6 h-6 text-primary" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
                <span className="text-lg font-bold">
                  {isCorrect ? 'Rätt svar!' : 'Fel svar'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  {eloDelta >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-primary" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span
                    className={`font-bold tabular-nums ${
                      eloDelta >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {eloDelta >= 0 ? '+' : ''}
                    {eloDelta} Elo
                  </span>
                </div>
                <RatingChip elo={result.skillRating.eloAfter} rd={result.skillRating.rdAfter} size="sm" />
              </div>

              <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                Förväntat: {(result.expectedScore * 100).toFixed(0)}% · CEFR: {result.overallCefr} · Streak: {result.streakCount}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  ← Dashboard
                </Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full">
                  Nästa övning <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
