import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCurriculumLesson, useCurriculumLessons, CurriculumExercise } from '@/hooks/useCurriculumLessons';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, ArrowRight, Loader2, Star, BookOpen, X,
} from 'lucide-react';
import { getCefrColor } from '@/lib/elo';

export default function CurriculumPlayer() {
  const { lang, level, lessonId } = useParams<{ lang: string; level: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: lesson, isLoading } = useCurriculumLesson(lang ?? null, level ?? null, lessonId ?? null);
  const { data: allLessons } = useCurriculumLessons(lang ?? null, level);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [matchLeft, setMatchLeft] = useState<number | null>(null);
  const [wordOrderSelected, setWordOrderSelected] = useState<number[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  // Reset when lesson changes
  useEffect(() => {
    setCurrentIdx(0);
    setAnswered(false);
    setCorrect(false);
    setSelectedAnswer(null);
    setTextAnswer('');
    setMatchedPairs(new Set());
    setMatchLeft(null);
    setWordOrderSelected([]);
    setTotalCorrect(0);
    setFinished(false);
  }, [lessonId]);

  const exercises = lesson?.exercises ?? [];
  const exercise = exercises[currentIdx];
  const total = exercises.length;
  const progressPct = total > 0 ? ((currentIdx + (answered || exercise?.type === 'vocabulary_intro' ? 1 : 0)) / total) * 100 : 0;

  // Next lesson
  const nextLesson = useMemo(() => {
    if (!allLessons || !lessonId) return null;
    const idx = allLessons.findIndex(l => l.id === lessonId);
    return idx >= 0 && idx + 1 < allLessons.length ? allLessons[idx + 1] : null;
  }, [allLessons, lessonId]);

  const resetExercise = useCallback(() => {
    setAnswered(false);
    setCorrect(false);
    setSelectedAnswer(null);
    setTextAnswer('');
    setMatchedPairs(new Set());
    setMatchLeft(null);
    setWordOrderSelected([]);
  }, []);

  const goNext = useCallback(() => {
    if (currentIdx + 1 < total) {
      setCurrentIdx(i => i + 1);
      resetExercise();
    } else {
      setFinished(true);
    }
  }, [currentIdx, total, resetExercise]);

  const checkAnswer = useCallback(() => {
    if (!exercise) return;
    let isCorrect = false;

    if (exercise.type === 'multiple_choice') {
      isCorrect = selectedAnswer === exercise.correct;
    } else if (exercise.type === 'translate') {
      const userAns = textAnswer.trim().toLowerCase();
      const correctAns = (exercise.answer || '').toLowerCase();
      const alts = (exercise.alternatives || []).map(a => a.toLowerCase());
      isCorrect = userAns === correctAns || alts.includes(userAns);
    } else if (exercise.type === 'fill_blank') {
      const userAns = textAnswer.trim().toLowerCase();
      isCorrect = userAns === (exercise.answer || '').toLowerCase();
    } else if (exercise.type === 'word_order') {
      isCorrect = JSON.stringify(wordOrderSelected) === JSON.stringify(exercise.correct_order);
    } else if (exercise.type === 'match_pairs') {
      isCorrect = matchedPairs.size === (exercise.pairs?.length ?? 0);
    }

    setCorrect(isCorrect);
    if (isCorrect) setTotalCorrect(n => n + 1);
    setAnswered(true);
  }, [exercise, selectedAnswer, textAnswer, wordOrderSelected, matchedPairs]);

  // Match pairs logic
  const handleMatchTap = useCallback((side: 'left' | 'right', idx: number) => {
    if (!exercise?.pairs || matchedPairs.has(idx)) return;
    if (side === 'left') {
      setMatchLeft(idx);
    } else if (matchLeft !== null) {
      // Check if this right matches the selected left
      if (matchLeft === idx) {
        setMatchedPairs(prev => new Set([...prev, idx]));
      }
      setMatchLeft(null);
    }
  }, [exercise, matchLeft, matchedPairs]);

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
          <p className="text-muted-foreground">Lesson not found.</p>
          <Link to="/courses" className="text-primary hover:underline mt-4 inline-block">← Back to courses</Link>
        </main>
      </div>
    );
  }

  const cefrColor = getCefrColor(lesson.level);

  // ── Finished ──
  if (finished) {
    const exerciseCount = exercises.filter(e => e.type !== 'vocabulary_intro').length;
    const pct = exerciseCount > 0 ? Math.round((totalCorrect / exerciseCount) * 100) : 100;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-lg text-center">
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Lesson Complete!</h1>
            <p className="text-muted-foreground mb-4">{lesson.title}</p>
            <p className="text-4xl font-bold text-primary mb-1">{pct}%</p>
            <p className="text-sm text-muted-foreground mb-2">
              {totalCorrect} of {exerciseCount} correct
            </p>
            <div className="flex items-center justify-center gap-2 mb-6 text-secondary">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg">+{lesson.xp} XP</span>
            </div>
            <div className="flex flex-col gap-3">
              {nextLesson && (
                <Button className="w-full" onClick={() => navigate(`/learn/${nextLesson.language}/${nextLesson.level}/${nextLesson.id}`)}>
                  Next: {nextLesson.title} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/courses')}>
                ← Back to courses
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/courses')} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <Progress value={progressPct} className="flex-1 h-2.5" />
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {currentIdx + 1}/{total}
          </span>
        </div>

        {/* Level + title */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}>
            {lesson.level}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{lesson.title}</span>
        </div>

        {/* Exercise card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card mb-6">
          {/* Vocabulary intro */}
          {exercise.type === 'vocabulary_intro' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">New Words</span>
              </div>
              <div className="space-y-3">
                {exercise.items?.map((item, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-bold">{item.word}</span>
                      <span className="text-sm text-muted-foreground">{item.translation}</span>
                    </div>
                    {item.example && (
                      <p className="text-sm text-muted-foreground/70 italic mt-1">{item.example}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multiple choice */}
          {exercise.type === 'multiple_choice' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{exercise.prompt}</h2>
              <div className="grid gap-3">
                {exercise.options?.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const showCorrect = answered && idx === exercise.correct;
                  const showWrong = answered && isSelected && idx !== exercise.correct;
                  return (
                    <button key={idx} onClick={() => !answered && setSelectedAnswer(idx)} disabled={answered}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        showCorrect ? 'border-primary bg-primary/5' : showWrong ? 'border-destructive bg-destructive/5'
                        : isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                      } ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        showCorrect ? 'bg-primary text-primary-foreground' : showWrong ? 'bg-destructive text-destructive-foreground'
                        : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>{String.fromCharCode(65 + idx)}</span>
                      <span className="font-medium">{opt}</span>
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                      {showWrong && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Translate */}
          {exercise.type === 'translate' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">{exercise.prompt}</h2>
              <div className="rounded-xl bg-muted/50 p-4 mb-4">
                <p className="text-xl font-bold">{exercise.source}</p>
              </div>
              <input type="text" value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                disabled={answered} placeholder="Type your answer…"
                className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-base focus:border-primary focus:outline-none disabled:opacity-60"
                onKeyDown={e => e.key === 'Enter' && !answered && textAnswer.trim() && checkAnswer()}
              />
              {answered && (
                <p className={`mt-3 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                  {correct ? '✓ Correct!' : `✗ Answer: ${exercise.answer}`}
                </p>
              )}
            </div>
          )}

          {/* Fill blank */}
          {exercise.type === 'fill_blank' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {exercise.sentence?.replace('___', '______')}
              </h2>
              <div className="grid gap-2">
                {exercise.options?.map((opt, idx) => {
                  const isSelected = textAnswer === opt;
                  const showCorrect = answered && opt === exercise.answer;
                  const showWrong = answered && isSelected && opt !== exercise.answer;
                  return (
                    <button key={idx} onClick={() => !answered && setTextAnswer(opt)} disabled={answered}
                      className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition-all ${
                        showCorrect ? 'border-primary bg-primary/5' : showWrong ? 'border-destructive bg-destructive/5'
                        : isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                      } ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                      {opt}
                      {showCorrect && <CheckCircle2 className="w-4 h-4 text-primary inline ml-2" />}
                      {showWrong && <XCircle className="w-4 h-4 text-destructive inline ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Word order */}
          {exercise.type === 'word_order' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{exercise.prompt}</h2>
              {/* Built sentence */}
              <div className="min-h-[52px] rounded-xl border-2 border-dashed border-border/50 bg-muted/30 p-3 mb-4 flex flex-wrap gap-2">
                {wordOrderSelected.length === 0 && (
                  <span className="text-muted-foreground text-sm">Tap words below to build the sentence</span>
                )}
                {wordOrderSelected.map((wordIdx, i) => (
                  <button key={i}
                    onClick={() => !answered && setWordOrderSelected(prev => prev.filter((_, j) => j !== i))}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-80 transition-opacity">
                    {exercise.words?.[wordIdx]}
                  </button>
                ))}
              </div>
              {/* Available words */}
              <div className="flex flex-wrap gap-2">
                {exercise.words?.map((word, idx) => {
                  const used = wordOrderSelected.includes(idx);
                  return (
                    <button key={idx} disabled={used || answered}
                      onClick={() => setWordOrderSelected(prev => [...prev, idx])}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        used ? 'opacity-30 border-border/30' : 'border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                      } ${answered ? 'cursor-default' : ''}`}>
                      {word}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className={`mt-3 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                  {correct ? '✓ Correct!' : `✗ Correct order: ${exercise.correct_order?.map(i => exercise.words?.[i]).join(' ')}`}
                </p>
              )}
            </div>
          )}

          {/* Match pairs */}
          {exercise.type === 'match_pairs' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Match the pairs</h2>
              {/* Shuffled pairs display */}
              <MatchPairsExercise
                pairs={exercise.pairs || []}
                answered={answered}
                onComplete={() => {
                  setMatchedPairs(new Set(exercise.pairs?.map((_, i) => i) || []));
                  setCorrect(true);
                  setTotalCorrect(n => n + 1);
                  setAnswered(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Action */}
        {exercise.type === 'vocabulary_intro' ? (
          <Button onClick={goNext} className="w-full h-12 text-base">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : !answered ? (
          <Button onClick={checkAnswer} className="w-full h-12 text-base"
            disabled={
              (exercise.type === 'multiple_choice' && selectedAnswer === null) ||
              (exercise.type === 'translate' && !textAnswer.trim()) ||
              (exercise.type === 'fill_blank' && !textAnswer) ||
              (exercise.type === 'word_order' && wordOrderSelected.length !== (exercise.words?.length ?? 0)) ||
              (exercise.type === 'match_pairs')
            }>
            Check
          </Button>
        ) : (
          <Button onClick={goNext} className="w-full h-12 text-base">
            {currentIdx + 1 >= total ? 'Finish' : 'Continue'} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </main>
    </div>
  );
}

// ── Match Pairs Component ──
function MatchPairsExercise({
  pairs,
  answered,
  onComplete,
}: {
  pairs: { left: string; right: string }[];
  answered: boolean;
  onComplete: () => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);

  // Shuffle right side once
  const shuffledRight = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [pairs.length]);

  useEffect(() => {
    if (matched.size === pairs.length && pairs.length > 0) {
      onComplete();
    }
  }, [matched.size, pairs.length]);

  const handleLeftTap = (idx: number) => {
    if (matched.has(idx) || answered) return;
    setSelectedLeft(idx);
    if (selectedRight !== null) {
      tryMatch(idx, selectedRight);
    }
  };

  const handleRightTap = (shuffledIdx: number) => {
    const realIdx = shuffledRight[shuffledIdx];
    if (matched.has(realIdx) || answered) return;
    setSelectedRight(shuffledIdx);
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, shuffledIdx);
    }
  };

  const tryMatch = (leftIdx: number, rightShuffledIdx: number) => {
    const rightRealIdx = shuffledRight[rightShuffledIdx];
    if (leftIdx === rightRealIdx) {
      setMatched(prev => new Set([...prev, leftIdx]));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setWrongFlash({ left: leftIdx, right: rightShuffledIdx });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {pairs.map((pair, idx) => {
          const isMatched = matched.has(idx);
          const isSelected = selectedLeft === idx;
          const isWrong = wrongFlash?.left === idx;
          return (
            <button key={idx} onClick={() => handleLeftTap(idx)} disabled={isMatched || answered}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium text-left transition-all ${
                isMatched ? 'border-primary/30 bg-primary/5 opacity-60' :
                isWrong ? 'border-destructive bg-destructive/5' :
                isSelected ? 'border-primary bg-primary/5' :
                'border-border/50 hover:border-primary/30 cursor-pointer'
              }`}>
              {pair.left}
              {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-primary inline ml-1" />}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {shuffledRight.map((realIdx, shuffledIdx) => {
          const pair = pairs[realIdx];
          const isMatched = matched.has(realIdx);
          const isSelected = selectedRight === shuffledIdx;
          const isWrong = wrongFlash?.right === shuffledIdx;
          return (
            <button key={shuffledIdx} onClick={() => handleRightTap(shuffledIdx)} disabled={isMatched || answered}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium text-left transition-all ${
                isMatched ? 'border-primary/30 bg-primary/5 opacity-60' :
                isWrong ? 'border-destructive bg-destructive/5' :
                isSelected ? 'border-primary bg-primary/5' :
                'border-border/50 hover:border-primary/30 cursor-pointer'
              }`}>
              {pair.right}
              {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-primary inline ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
