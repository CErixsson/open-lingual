import { TrendingUp, TrendingDown, Minus, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { AttemptResult } from '@/hooks/useSubmitAttempt';
import RatingChip from '@/components/elo/RatingChip';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SessionReviewProps {
  result: AttemptResult;
  exerciseTitle: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function SessionReview({
  result,
  exerciseTitle,
  isCorrect,
  timeSpent,
}: SessionReviewProps) {
  const skillDelta = result.skillRating.eloAfter - result.skillRating.eloBefore;

  return (
    <div className="space-y-4">
      {/* Result summary */}
      <div
        className={`rounded-2xl p-6 ${
          isCorrect
            ? 'bg-primary/10 border border-primary/30'
            : 'bg-destructive/10 border border-destructive/30'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <RotateCcw className="w-6 h-6 text-destructive" />
          )}
          <span className="text-lg font-bold">
            {isCorrect ? 'Rätt svar!' : 'Fel svar'}
          </span>
        </div>

        {/* Stat changes */}
        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Skill Elo</div>
            <div className="flex items-center justify-center gap-1">
              {skillDelta >= 0 ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={`font-bold tabular-nums ${
                  skillDelta >= 0 ? 'text-primary' : 'text-destructive'
                }`}
              >
                {skillDelta >= 0 ? '+' : ''}
                {skillDelta}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">CEFR</div>
            <RatingChip elo={result.overallElo} size="sm" />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Streak</div>
            <span className="font-bold tabular-nums text-secondary">{result.streakCount}</span>
          </div>
        </div>

        {/* One clear next action */}
        <div className="mt-4 p-3 rounded-lg bg-background/50 text-center">
          <p className="text-xs text-muted-foreground">
            {isCorrect
              ? skillDelta > 15
                ? '🔥 Utmärkt prestation! Prova en svårare övning härnäst.'
                : 'Bra jobbat! Fortsätt med nästa övning för att bibehålla momentumet.'
              : 'Ingen fara — repetition stärker minnet. Prova en liknande övning.'}
          </p>
        </div>
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
            Nästa övning →
          </Button>
        </Link>
      </div>
    </div>
  );
}
