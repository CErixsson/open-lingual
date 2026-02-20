/**
 * Tracks curriculum lesson completion in Supabase.
 * Curriculum lessons have string IDs (e.g. "es-a1-greetings-1").
 */
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurriculumLessonProgress {
  lessonId: string;
  completionPercent: number;
  xp: number;
  completedAt?: string;
  languageCode: string;
}

export function useCurriculumProgress(languageCode?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progressRows, isLoading } = useQuery({
    queryKey: ['curriculum-progress', user?.id, languageCode],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('curriculum_progress')
        .select('*')
        .eq('user_id', user!.id);
      if (languageCode) q = q.eq('language_code', languageCode);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const progress = useMemo(() => {
    const map: Record<string, CurriculumLessonProgress> = {};
    for (const row of progressRows || []) {
      map[row.lesson_id] = {
        lessonId: row.lesson_id,
        completionPercent: row.completion_percent,
        xp: row.xp,
        completedAt: row.completed_at ?? undefined,
        languageCode: row.language_code,
      };
    }
    return map;
  }, [progressRows]);

  const upsertMutation = useMutation({
    mutationFn: async (params: {
      lessonId: string;
      completionPercent: number;
      xp: number;
      languageCode: string;
    }) => {
      const { data, error } = await supabase
        .from('curriculum_progress')
        .upsert(
          {
            user_id: user!.id,
            lesson_id: params.lessonId,
            language_code: params.languageCode,
            completion_percent: params.completionPercent,
            xp: params.xp,
            ...(params.completionPercent >= 100
              ? { completed_at: new Date().toISOString() }
              : {}),
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress'] });
    },
  });

  const getLessonProgress = useCallback(
    (lessonId: string): CurriculumLessonProgress | null => {
      return progress[lessonId] ?? null;
    },
    [progress]
  );

  const setLessonProgress = useCallback(
    (lessonId: string, completionPercent: number, xp: number, langCode?: string) => {
      if (!user) return;
      const lc = langCode || languageCode || '';
      upsertMutation.mutate({
        lessonId,
        completionPercent,
        xp,
        languageCode: lc,
      });
    },
    [user, languageCode, upsertMutation]
  );

  const isLessonComplete = useCallback(
    (lessonId: string): boolean => {
      return (progress[lessonId]?.completionPercent ?? 0) >= 100;
    },
    [progress]
  );

  const getLessonCompletion = useCallback(
    (lessonId: string): number => {
      return progress[lessonId]?.completionPercent ?? 0;
    },
    [progress]
  );

  const totalXp = useMemo(
    () => Object.values(progress).reduce((sum, p) => sum + (p.xp || 0), 0),
    [progress]
  );

  const completedCount = useMemo(
    () => Object.values(progress).filter(p => p.completionPercent >= 100).length,
    [progress]
  );

  return {
    progress,
    getLessonProgress,
    setLessonProgress,
    isLessonComplete,
    getLessonCompletion,
    totalXp,
    completedCount,
    isLoading,
  };
}
