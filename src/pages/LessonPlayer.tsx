import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLesson } from '@/hooks/useLessons';
import { useMyProgress, useUpsertProgress } from '@/hooks/useLearnerProgress';
import { useLessonsByLanguageCode } from '@/hooks/useCourses';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2,
  BookOpen, Star, Play, Eye, PenLine, Mic, ChevronRight,
} from 'lucide-react';
import { getCefrColor } from '@/lib/elo';

// Phase type icons
const PHASE_ICONS: Record<string, any> = {
  build: Eye,
  controlled_practice: PenLine,
  guided_production: Mic,
  free_performance: Star,
};

const PHASE_LABELS: Record<string, string> = {
  build: 'Build',
  controlled_practice: 'Practice',
  guided_production: 'Guided',
  free_performance: 'Perform',
};

export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: lesson, isLoading } = useLesson(id ?? null);

  // For "next lesson" navigation
  const langCode = lesson?.language ?? null;
  const { data: allLessons } = useLessonsByLanguageCode(langCode);
  const { data: myProgress } = useMyProgress(user?.id ?? null);

  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [clozeAnswers, setClozeAnswers] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [phaseScore, setPhaseScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [buildRead, setBuildRead] = useState(false);
  const savedRef = useRef(false);
  const upsertProgress = useUpsertProgress();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // Reset state when lesson changes
  useEffect(() => {
    setCurrentPhaseIdx(0);
    setCurrentBlockIdx(0);
    resetBlock();
    setPhaseScore(0);
    setTotalCorrect(0);
    setTotalExercises(0);
    setFinished(false);
    setXpEarned(0);
    setBuildRead(false);
    savedRef.current = false;
  }, [id]);

  const phases = useMemo(() => {
    if (!lesson?.phases) return [];
    const p = lesson.phases as any[];
    return Array.isArray(p) ? p : [];
  }, [lesson]);

  // Also support old exercise-based lessons
  const exercises = useMemo(() => {
    if (!lesson?.exercises) return [];
    const e = lesson.exercises as any[];
    return Array.isArray(e) ? e : [];
  }, [lesson]);

  const isPhaseLesson = phases.length > 0;
  const currentPhase = isPhaseLesson ? phases[currentPhaseIdx] : null;
  const blocks = currentPhase?.blocks ?? [];
  const currentBlock = blocks[currentBlockIdx];

  const totalBlocks = phases.reduce((sum: number, p: any) => sum + (p.blocks?.length ?? 0), 0);
  const completedBlocks = phases.slice(0, currentPhaseIdx).reduce((sum: number, p: any) => sum + (p.blocks?.length ?? 0), 0) + currentBlockIdx + (answered || buildRead ? 1 : 0);
  const progressPercent = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;

  // Find next lesson
  const sortedLessons = useMemo(() => {
    if (!allLessons) return [];
    return allLessons
      .filter((l: any) => l.phases && Array.isArray(l.phases) && l.phases.length > 0)
      .sort((a: any, b: any) => {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        return levels.indexOf(a.level) - levels.indexOf(b.level) || a.title.localeCompare(b.title);
      });
  }, [allLessons]);

  const currentLessonIndex = sortedLessons.findIndex((l: any) => l.id === id);
  const nextLesson = currentLessonIndex >= 0 ? sortedLessons[currentLessonIndex + 1] : null;

  function resetBlock() {
    setSelectedAnswer(null);
    setTextAnswer('');
    setClozeAnswers([]);
    setAnswered(false);
    setCorrect(false);
    setBuildRead(false);
  }

  function checkAnswer() {
    if (!currentBlock) return;
    let isCorrect = false;

    if (currentBlock.type === 'multiple_choice') {
      const correctIdx = currentBlock.items?.findIndex((item: any) => item.correct);
      isCorrect = selectedAnswer === correctIdx;
      setTotalExercises(n => n + 1);
      if (isCorrect) { setTotalCorrect(n => n + 1); setPhaseScore(s => s + 1); }
    } else if (currentBlock.type === 'cloze') {
      const items = currentBlock.items ?? [];
      isCorrect = items.every((item: any, i: number) => {
        const userAns = (clozeAnswers[i] || '').trim().toLowerCase();
        const correct = item.answer.toLowerCase();
        const alts = (item.alternatives || []).map((a: string) => a.toLowerCase());
        return userAns === correct || alts.includes(userAns);
      });
      setTotalExercises(n => n + 1);
      if (isCorrect) { setTotalCorrect(n => n + 1); setPhaseScore(s => s + 1); }
    } else if (currentBlock.type === 'open_response') {
      // For open response, just accept if meets min words
      const wordCount = textAnswer.trim().split(/\s+/).filter(Boolean).length;
      const minWords = currentBlock.min_words || 1;
      isCorrect = wordCount >= minWords;
      setTotalExercises(n => n + 1);
      if (isCorrect) { setTotalCorrect(n => n + 1); setPhaseScore(s => s + 1); }
    }

    setCorrect(isCorrect);
    setAnswered(true);
  }

  function nextBlock() {
    if (currentBlockIdx + 1 < blocks.length) {
      setCurrentBlockIdx(i => i + 1);
      resetBlock();
    } else if (currentPhaseIdx + 1 < phases.length) {
      setCurrentPhaseIdx(i => i + 1);
      setCurrentBlockIdx(0);
      setPhaseScore(0);
      resetBlock();
    } else {
      setFinished(true);
    }
  }

  // Save progress when finished
  useEffect(() => {
    if (finished && user && id && !savedRef.current) {
      savedRef.current = true;
      const pct = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 100;
      const baseXp = totalExercises * 10;
      const accuracyBonus = Math.round(baseXp * (totalCorrect / Math.max(totalExercises, 1)) * 0.5);
      const totalXp = Math.max(baseXp + accuracyBonus, 10);
      setXpEarned(totalXp);

      upsertProgress.mutate({
        user_id: user.id,
        lesson_id: id,
        completion_percent: 100,
        xp: totalXp,
      });
    }
  }, [finished]);

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

  // ── Finished screen ──
  if (finished) {
    const pct = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 100;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-lg text-center">
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Lesson Complete!</h1>
            <p className="text-muted-foreground mb-4">{lesson.title}</p>
            <p className="text-3xl font-bold text-primary mb-1">{pct}%</p>
            <p className="text-sm text-muted-foreground mb-2">
              {totalCorrect} of {totalExercises} correct
            </p>
            {xpEarned > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6 text-secondary">
                <Star className="w-5 h-5 fill-secondary" />
                <span className="font-bold text-lg">+{xpEarned} XP</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {nextLesson && (
                <Button className="w-full" onClick={() => navigate(`/lessons/${nextLesson.id}`)}>
                  Next Lesson: {nextLesson.title} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => {
                  setCurrentPhaseIdx(0); setCurrentBlockIdx(0); resetBlock();
                  setPhaseScore(0); setTotalCorrect(0); setTotalExercises(0);
                  setFinished(false); setXpEarned(0); savedRef.current = false;
                }}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── No content ──
  if (!isPhaseLesson && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">No exercises in this lesson yet.</p>
          <Link to="/courses" className="text-primary hover:underline mt-4 inline-block">← Back to courses</Link>
        </main>
      </div>
    );
  }

  // ── Phase-based rendering ──
  if (isPhaseLesson && currentPhase) {
    const PhaseIcon = PHASE_ICONS[currentPhase.type] || BookOpen;
    const phaseLabel = PHASE_LABELS[currentPhase.type] || currentPhase.title;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          {/* Lesson header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}>
              {lesson.level}
            </span>
            <h1 className="text-lg font-bold truncate">{lesson.title}</h1>
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-1 mb-3">
            {phases.map((p: any, i: number) => {
              const Icon = PHASE_ICONS[p.type] || BookOpen;
              const active = i === currentPhaseIdx;
              const done = i < currentPhaseIdx;
              return (
                <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  active ? 'bg-primary/15 text-primary' : done ? 'bg-muted text-muted-foreground' : 'text-muted-foreground/50'
                }`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{PHASE_LABELS[p.type] || `Phase ${i + 1}`}</span>
                  {i < phases.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-1" />}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(progressPercent)}%
            </span>
          </div>

          {/* Block rendering */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PhaseIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {currentPhase.title || phaseLabel}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {currentBlockIdx + 1}/{blocks.length}
              </span>
            </div>

            {/* Vocabulary block */}
            {currentBlock?.type === 'vocabulary' && (
              <div className="space-y-3">
                {currentBlock.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="flex-1">
                      <p className="font-semibold">{item.term}</p>
                      <p className="text-sm text-muted-foreground">{item.translation}</p>
                    </div>
                    {item.example && (
                      <p className="text-sm text-muted-foreground italic max-w-[50%]">{item.example}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text/grammar block */}
            {currentBlock?.type === 'text' && (
              <div className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: simpleMarkdown(currentBlock.content || '') }} />
            )}

            {/* Multiple choice block */}
            {currentBlock?.type === 'multiple_choice' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{currentBlock.prompt}</h2>
                <div className="grid gap-3">
                  {currentBlock.items?.map((item: any, idx: number) => {
                    const isSelected = selectedAnswer === idx;
                    const showCorrect = answered && item.correct;
                    const showWrong = answered && isSelected && !item.correct;
                    return (
                      <button key={idx} onClick={() => !answered && setSelectedAnswer(idx)} disabled={answered}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          showCorrect ? 'border-primary bg-primary/5' : showWrong ? 'border-destructive bg-destructive/5'
                          : isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                        } ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          showCorrect ? 'bg-primary text-primary-foreground' : showWrong ? 'bg-destructive text-destructive-foreground'
                          : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>{String.fromCharCode(65 + idx)}</span>
                        <span className="font-medium">{item.text}</span>
                        {showCorrect && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                        {showWrong && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cloze block */}
            {currentBlock?.type === 'cloze' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{currentBlock.prompt}</h2>
                <div className="space-y-3">
                  {(currentBlock.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Blank {i + 1}:</span>
                      <input type="text" value={clozeAnswers[i] || ''} disabled={answered}
                        onChange={e => {
                          const next = [...clozeAnswers];
                          next[i] = e.target.value;
                          setClozeAnswers(next);
                        }}
                        placeholder="Type your answer…"
                        className="flex-1 rounded-xl border-2 border-border/50 bg-background px-4 py-2 text-base focus:border-primary focus:outline-none disabled:opacity-60" />
                    </div>
                  ))}
                </div>
                {answered && (
                  <p className={`mt-3 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                    {correct ? 'Correct!' : `Answer: ${(currentBlock.items ?? []).map((i: any) => i.answer).join(', ')}`}
                  </p>
                )}
              </div>
            )}

            {/* Open response block */}
            {currentBlock?.type === 'open_response' && (
              <div>
                <h2 className="text-lg font-semibold mb-3">{currentBlock.prompt}</h2>
                {currentBlock.hints?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentBlock.hints.map((hint: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{hint}</Badge>
                    ))}
                  </div>
                )}
                {currentBlock.min_words && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Minimum {currentBlock.min_words} words · Current: {textAnswer.trim().split(/\s+/).filter(Boolean).length}
                  </p>
                )}
                <Textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                  disabled={answered} placeholder="Write your response…" rows={4}
                  className="resize-none" />
                {answered && (
                  <p className={`mt-3 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                    {correct ? 'Great work!' : `Try to write at least ${currentBlock.min_words} words.`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action button */}
          {(currentBlock?.type === 'vocabulary' || currentBlock?.type === 'text') ? (
            <Button onClick={() => { setBuildRead(true); nextBlock(); }} className="w-full h-12 text-base">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : !answered ? (
            <Button onClick={checkAnswer} className="w-full h-12 text-base"
              disabled={
                (currentBlock?.type === 'multiple_choice' && selectedAnswer === null) ||
                (currentBlock?.type === 'cloze' && clozeAnswers.filter(Boolean).length < (currentBlock?.items?.length ?? 1)) ||
                (currentBlock?.type === 'open_response' && !textAnswer.trim())
              }>
              Submit
            </Button>
          ) : (
            <Button onClick={nextBlock} className="w-full h-12 text-base">
              {currentPhaseIdx + 1 >= phases.length && currentBlockIdx + 1 >= blocks.length ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </main>
      </div>
    );
  }

  // ── Legacy exercise-based rendering (unchanged) ──
  // Falls through for old-format lessons with exercises array
  const currentIdx = currentBlockIdx;
  const current = exercises[currentIdx];
  const total = exercises.length;
  const progress = total > 0 ? ((currentIdx + (answered ? 1 : 0)) / total) * 100 : 0;

  const checkLegacyAnswer = () => {
    if (!current) return;
    let isCorrect = false;
    if (current.type === 'multiple_choice' && selectedAnswer !== null) {
      isCorrect = selectedAnswer === current.correctIndex;
    } else if (current.type === 'cloze') {
      isCorrect = textAnswer.trim().toLowerCase() === current.correctAnswer?.toLowerCase();
    }
    setCorrect(isCorrect);
    if (isCorrect) setTotalCorrect(n => n + 1);
    setAnswered(true);
  };

  const nextExercise = () => {
    if (currentIdx + 1 >= total) { setFinished(true); setTotalExercises(total); return; }
    setCurrentBlockIdx(i => i + 1);
    resetBlock();
  };

  if (!current || total === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">No exercises in this lesson.</p>
          <Link to="/courses" className="text-primary hover:underline mt-4 inline-block">← Back to courses</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `hsl(${cefrColor} / 0.15)`, color: `hsl(${cefrColor})` }}>
            {lesson.level}
          </span>
          <h1 className="text-lg font-bold truncate">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground tabular-nums">{currentIdx + 1}/{total}</span>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold mb-6">
            {current.type === 'cloze' ? current.text?.replace('___', '______') : current.question}
          </h2>
          {current.type === 'multiple_choice' && current.options && (
            <div className="grid gap-3">
              {current.options.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === idx;
                const showCorrect = answered && idx === current.correctIndex;
                const showWrong = answered && isSelected && idx !== current.correctIndex;
                return (
                  <button key={idx} onClick={() => !answered && setSelectedAnswer(idx)} disabled={answered}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      showCorrect ? 'border-primary bg-primary/5' : showWrong ? 'border-destructive bg-destructive/5'
                      : isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                    } ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      showCorrect ? 'bg-primary text-primary-foreground' : showWrong ? 'bg-destructive text-destructive-foreground'
                      : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>{String.fromCharCode(65 + idx)}</span>
                    <span className="font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}
          {current.type === 'cloze' && (
            <div>
              <input type="text" value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={answered}
                placeholder="Type your answer…"
                className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none disabled:opacity-60" />
              {answered && (
                <p className={`mt-2 text-sm font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>
                  {correct ? 'Correct!' : `Answer: ${current.correctAnswer}`}
                </p>
              )}
            </div>
          )}
        </div>
        {!answered ? (
          <Button onClick={checkLegacyAnswer} className="w-full h-12 text-base"
            disabled={(current.type === 'multiple_choice' && selectedAnswer === null) || (current.type === 'cloze' && !textAnswer.trim())}>
            Submit
          </Button>
        ) : (
          <Button onClick={nextExercise} className="w-full h-12 text-base">
            {currentIdx + 1 >= total ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </main>
    </div>
  );
}

// Simple markdown to HTML (bold, italic, lists)
function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}
