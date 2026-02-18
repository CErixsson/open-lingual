/**
 * Tracks curriculum lesson completion in localStorage.
 * Curriculum lessons have string IDs (e.g. "es-a1-greetings-1"),
 * which are different from DB lesson UUIDs.
 */
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'dialectdrift_curriculum_progress';

export interface CurriculumLessonProgress {
  lessonId: string;
  completionPercent: number;
  xp: number;
  completedAt?: string;
}

function loadProgress(): Record<string, CurriculumLessonProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(data: Record<string, CurriculumLessonProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useCurriculumProgress() {
  const [progress, setProgress] = useState<Record<string, CurriculumLessonProgress>>(loadProgress);

  const getLessonProgress = useCallback((lessonId: string): CurriculumLessonProgress | null => {
    return progress[lessonId] ?? null;
  }, [progress]);

  const setLessonProgress = useCallback((lessonId: string, completionPercent: number, xp: number) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [lessonId]: {
          lessonId,
          completionPercent,
          xp,
          ...(completionPercent >= 100 ? { completedAt: new Date().toISOString() } : {}),
        },
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const isLessonComplete = useCallback((lessonId: string): boolean => {
    return (progress[lessonId]?.completionPercent ?? 0) >= 100;
  }, [progress]);

  const getLessonCompletion = useCallback((lessonId: string): number => {
    return progress[lessonId]?.completionPercent ?? 0;
  }, [progress]);

  const totalXp = Object.values(progress).reduce((sum, p) => sum + (p.xp || 0), 0);
  const completedCount = Object.values(progress).filter(p => p.completionPercent >= 100).length;

  return {
    progress,
    getLessonProgress,
    setLessonProgress,
    isLessonComplete,
    getLessonCompletion,
    totalXp,
    completedCount,
  };
}
