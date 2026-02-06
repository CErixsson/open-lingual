export interface CefrBand {
  level: string;
  band_min: number;
  band_max: number;
}

const DEFAULT_BANDS: CefrBand[] = [
  { level: 'A1', band_min: 800, band_max: 999 },
  { level: 'A2', band_min: 1000, band_max: 1199 },
  { level: 'B1', band_min: 1200, band_max: 1399 },
  { level: 'B2', band_min: 1400, band_max: 1599 },
  { level: 'C1', band_min: 1600, band_max: 1799 },
  { level: 'C2', band_min: 1800, band_max: 2500 },
];

export function expectedScore(playerRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
}

export function getKFactor(rd: number, attempts: number, elo: number): number {
  if (rd > 200 || attempts < 20) return 40;
  if (elo >= 1600 || attempts > 100) return 10;
  return 20;
}

export function calculateNewRating(
  oldRating: number,
  kFactor: number,
  scoreRaw: number,
  expected: number
): number {
  return Math.round(oldRating + kFactor * (scoreRaw - expected));
}

export function applyTimeBonus(
  scoreRaw: number,
  timeSpentSec: number,
  timeLimitSec: number | null
): number {
  if (!timeLimitSec || timeSpentSec >= timeLimitSec) return scoreRaw;
  const bonus = 0.1 * (1 - timeSpentSec / timeLimitSec);
  return Math.min(1.0, scoreRaw + bonus);
}

export function mapEloToCefr(elo: number, bands?: CefrBand[]): string {
  const b = bands || DEFAULT_BANDS;
  const found = b.find(band => elo >= band.band_min && elo <= band.band_max);
  if (found) return found.level;
  return elo < 800 ? 'A1' : 'C2';
}

export function getCefrProgress(elo: number, bands?: CefrBand[]): {
  level: string;
  progress: number;
  bandMin: number;
  bandMax: number;
  nextLevel: string | null;
} {
  const b = bands || DEFAULT_BANDS;
  const level = mapEloToCefr(elo, b);
  const currentBand = b.find(band => band.level === level);
  if (!currentBand) return { level, progress: 0, bandMin: 0, bandMax: 0, nextLevel: null };

  const range = currentBand.band_max - currentBand.band_min + 1;
  const progress = Math.min(100, Math.max(0, ((elo - currentBand.band_min) / range) * 100));

  const currentIndex = b.findIndex(band => band.level === level);
  const nextLevel = currentIndex < b.length - 1 ? b[currentIndex + 1].level : null;

  return { level, progress, bandMin: currentBand.band_min, bandMax: currentBand.band_max, nextLevel };
}

export const CEFR_COLORS: Record<string, string> = {
  'A1': '200 70% 50%',
  'A2': '158 64% 42%',
  'B1': '38 92% 60%',
  'B2': '12 85% 62%',
  'C1': '280 70% 50%',
  'C2': '340 80% 50%',
};

export function getCefrColor(level: string): string {
  return CEFR_COLORS[level] || CEFR_COLORS['A1'];
}

export const SKILL_ICONS: Record<string, string> = {
  listening: 'Headphones',
  reading: 'BookOpen',
  speaking: 'Mic',
  writing: 'PenTool',
  grammar: 'FileText',
  vocabulary: 'Library',
};
