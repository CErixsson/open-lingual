import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ProgressPoint } from '@/hooks/useProgressHistory';
import type { PeriodComparison } from '@/hooks/useProgressHistory';
import type { CefrBand } from '@/lib/elo';
import { CEFR_COLORS } from '@/lib/elo';
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight } from 'lucide-react';

const SKILL_COLORS: Record<string, string> = {
  Vocabulary: 'hsl(158, 64%, 42%)',
  Grammar: 'hsl(38, 92%, 60%)',
  Reading: 'hsl(200, 70%, 50%)',
  Listening: 'hsl(280, 70%, 50%)',
  Speaking: 'hsl(12, 85%, 62%)',
  Writing: 'hsl(340, 80%, 50%)',
};

interface ProgressChartProps {
  history: ProgressPoint[];
  comparison?: PeriodComparison;
  bands?: CefrBand[];
  isLoading: boolean;
}

export default function ProgressChart({
  history,
  comparison,
  bands,
  isLoading,
}: ProgressChartProps) {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<7 | 30>(7);

  const skills = useMemo(() => {
    const set = new Set(history.map(p => p.skillName));
    return Array.from(set);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!activeSkill) return history;
    return history.filter(p => p.skillName === activeSkill);
  }, [history, activeSkill]);

  // Group by date for charting
  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    filteredHistory.forEach(p => {
      const day = p.date.split('T')[0];
      if (!grouped[day]) grouped[day] = {};
      // Take latest elo for each skill per day
      grouped[day][p.skillName] = p.elo;
    });

    return Object.entries(grouped)
      .map(([date, skills]) => ({
        date: new Date(date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        ...skills,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHistory]);

  const activeSkills = activeSkill ? [activeSkill] : skills;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-soft">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Laddar graf...
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-soft text-center text-muted-foreground">
        Ingen historik ännu. Gör några övningar för att se din progression!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft space-y-4">
      {/* Skill toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSkill(null)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            !activeSkill
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border/50 text-muted-foreground hover:border-primary/30'
          }`}
        >
          Alla
        </button>
        {skills.map(skill => (
          <button
            key={skill}
            onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              activeSkill === skill
                ? 'text-primary-foreground border-primary'
                : 'border-border/50 text-muted-foreground hover:border-primary/30'
            }`}
            style={
              activeSkill === skill
                ? { backgroundColor: SKILL_COLORS[skill] || 'hsl(var(--primary))' }
                : {}
            }
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            {/* CEFR reference lines */}
            {bands?.map(band => (
              <ReferenceLine
                key={band.level}
                y={band.band_min}
                stroke={`hsl(${CEFR_COLORS[band.level] || '0 0% 50%'} / 0.3)`}
                strokeDasharray="5 5"
                label={{
                  value: band.level,
                  position: 'insideRight',
                  fill: `hsl(${CEFR_COLORS[band.level] || '0 0% 50%'})`,
                  fontSize: 10,
                }}
              />
            ))}
            {activeSkills.map(skill => (
              <Line
                key={skill}
                type="monotone"
                dataKey={skill}
                stroke={SKILL_COLORS[skill] || 'hsl(var(--primary))'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Period comparison */}
      {comparison && (comparison.current.sessions > 0 || comparison.previous.sessions > 0) && (
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Periodsjämförelse (7 dagar)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ComparisonStat
              label="Sessioner"
              current={comparison.current.sessions}
              previous={comparison.previous.sessions}
            />
            <ComparisonStat
              label="Snitt-Elo"
              current={comparison.current.avgElo}
              previous={comparison.previous.avgElo}
            />
            <ComparisonStat
              label="Rätt-svar"
              current={comparison.current.passRate}
              previous={comparison.previous.passRate}
              suffix="%"
            />
            <ComparisonStat
              label="Tid"
              current={Math.round(comparison.current.timeSpent / 60)}
              previous={Math.round(comparison.previous.timeSpent / 60)}
              suffix="m"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonStat({
  label,
  current,
  previous,
  suffix = '',
}: {
  label: string;
  current: number;
  previous: number;
  suffix?: string;
}) {
  const diff = current - previous;
  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? 'text-primary' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold tabular-nums">{current}{suffix}</span>
        {previous > 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${diffColor}`}>
            <DiffIcon className="w-2.5 h-2.5" />
            {diff > 0 ? '+' : ''}{diff}{suffix}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">Förra: {previous}{suffix}</span>
    </div>
  );
}
