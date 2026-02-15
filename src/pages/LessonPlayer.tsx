import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLesson } from '@/hooks/useLessons';
import { useUpsertProgress } from '@/hooks/useLearnerProgress';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  Star,
} from 'lucide-react';
import { getCefrColor } from '@/lib/elo';

interface LessonExercise {
  type: string;
  question: string;
  options?: string[];
  correctIndex?: number;
  text?: string;
  blank?: string;
  correctAnswer?: string;
  words?: string[];
  correctOrder?: number[];
}

export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: lesson, isLoading } = useLesson(id ?? null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [wordOrder, setWordOrder] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const savedRef = useRef(false);

  const upsertProgress = useUpsertProgress();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const exercises = (lesson?.exercises as unknown as LessonExercise[] | null) ?? [];
  const total = exercises.length;
  const current = exercises[currentIdx];
  const progress = total > 0 ? ((currentIdx + (answered ? 1 : 0)) / total) * 100 : 0;

  const checkAnswer = () => {
    if (!current) return;
    let isCorrect = false;

    if (current.type === 'multiple_choice' && selectedAnswer !== null) {
      isCorrect = selectedAnswer === current.correctIndex;
    } else if (current.type === 'cloze') {
      isCorrect = textAnswer.trim().toLowerCase() === current.correctAnswer?.toLowerCase();
    } else if (current.type === 'word_order' && current.correctOrder) {
      isCorrect = JSON.stringify(wordOrder) === JSON.stringify(current.correctOrder);
    }

    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 1);
    setAnswered(true);
  };

  // Save progress & XP when finished
  useEffect(() => {
    if (finished && user && id && !savedRef.current) {
      savedRef.current = true;
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      // XP formula: base 10 per exercise + bonus for accuracy
      const baseXp = total * 10;
      const accuracyBonus = Math.round(baseXp * (score / Math.max(total, 1)) * 0.5);
      const totalXp = baseXp + accuracyBonus;
      setXpEarned(totalXp);

      upsertProgress.mutate({
        user_id: user.id,
        lesson_id: id,
        completion_percent: pct >= 80 ? 100 : pct,
        xp: totalXp,
      });
    }
  }, [finished]);

  const nextExercise = () => {
    if (currentIdx + 1 >= total) {
      setFinished(true);
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer(null);
    setTextAnswer('');
    setWordOrder([]);
    setAnswered(false);
    setCorrect(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Lektionen hittades inte.</p>
          <Link to="/courses" className="text-primary hover:underline mt-4 inline-block">
            ← Tillbaka till kurser
          </Link>
        </main>
      </div>
    );
  }

  const cefrColor = getCefrColor(lesson.level);

  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-lg text-center">
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Lektion klar!</h1>
            <p className="text-muted-foreground mb-4">{lesson.title}</p>
            <p className="text-3xl font-bold text-primary mb-1">{pct}%</p>
            <p className="text-sm text-muted-foreground mb-2">
              {score} av {total} rätt
            </p>
            {xpEarned > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6 text-secondary">
                <Star className="w-5 h-5 fill-secondary" />
                <span className="font-bold text-lg">+{xpEarned} XP</span>
              </div>
            )}
            <div className="flex gap-3">
              <Link to="/courses" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Kurser
                </Button>
              </Link>
              <Button className="flex-1" onClick={() => {
                setCurrentIdx(0); setScore(0); setFinished(false); setXpEarned(0);
                savedRef.current = false;
                setAnswered(false); setSelectedAnswer(null); setTextAnswer(''); setWordOrder([]);
              }}>
                Gör om
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!current || total === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Inga övningar i denna lektion.</p>
          <Link to="/courses" className="text-primary hover:underline mt-4 inline-block">
            ← Tillbaka till kurser
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        {/* Lesson header */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}
          >
            {lesson.level}
          </span>
          <h1 className="text-lg font-bold truncate">{lesson.title}</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIdx + 1}/{total}
          </span>
        </div>

        {/* Exercise card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card mb-6">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
            {current.type === 'multiple_choice' ? 'Flerval' : current.type === 'cloze' ? 'Fyll i' : 'Ordna orden'}
          </p>
          <h2 className="text-lg font-semibold mb-6">
            {current.type === 'cloze' ? current.text?.replace('___', '______') : current.question}
          </h2>

          {/* Multiple choice */}
          {current.type === 'multiple_choice' && current.options && (
            <div className="grid gap-3">
              {current.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const showCorrect = answered && idx === current.correctIndex;
                const showWrong = answered && isSelected && idx !== current.correctIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => !answered && setSelectedAnswer(idx)}
                    disabled={answered}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      showCorrect ? 'border-primary bg-primary/5'
                        : showWrong ? 'border-destructive bg-destructive/5'
                        : isSelected ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                    } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      showCorrect ? 'bg-primary text-primary-foreground'
                        : showWrong ? 'bg-destructive text-destructive-foreground'
                        : isSelected ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium">{opt}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                    {showWrong && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Cloze */}
          {current.type === 'cloze' && (
            <div>
              <input
                type="text"
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                disabled={answered}
                placeholder="Skriv ditt svar…"
                className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-base focus:border-primary focus:outline-none disabled:opacity-60"
              />
              {answered && (
                <p className={`mt-2 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                  {correct ? 'Rätt!' : `Rätt svar: ${current.correctAnswer}`}
                </p>
              )}
            </div>
          )}

          {/* Word order */}
          {current.type === 'word_order' && current.words && (
            <div>
              <div className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border-2 border-dashed border-border/50 p-3 mb-3">
                {wordOrder.map((wi, i) => (
                  <button
                    key={i}
                    onClick={() => !answered && setWordOrder(prev => prev.filter((_, j) => j !== i))}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  >
                    {current.words![wi]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {current.words.map((word, wi) => {
                  const used = wordOrder.includes(wi);
                  return (
                    <button
                      key={wi}
                      onClick={() => !answered && !used && setWordOrder(prev => [...prev, wi])}
                      disabled={answered || used}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        used ? 'opacity-30 cursor-default' : 'bg-muted hover:bg-muted/80 cursor-pointer'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className={`mt-3 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                  {correct ? 'Rätt!' : `Rätt ordning: ${current.correctOrder?.map(i => current.words![i]).join(' ')}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        {!answered ? (
          <Button
            onClick={checkAnswer}
            disabled={
              (current.type === 'multiple_choice' && selectedAnswer === null) ||
              (current.type === 'cloze' && !textAnswer.trim()) ||
              (current.type === 'word_order' && wordOrder.length === 0)
            }
            className="w-full h-12 text-base"
          >
            Svara
          </Button>
        ) : (
          <Button onClick={nextExercise} className="w-full h-12 text-base">
            {currentIdx + 1 >= total ? 'Visa resultat' : 'Nästa'} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </main>
    </div>
  );
}
