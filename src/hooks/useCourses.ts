import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapEloToCefr } from '@/lib/elo';

export interface CourseExercise {
  id: string;
  title: string;
  description: string | null;
  difficulty_elo: number;
  tags: string[];
  time_limit_sec: number | null;
  content: any;
  skills: { id: string; key: string; display_name: string; icon_name: string | null } | null;
}

export interface CourseLevel {
  level: string;
  exercises: CourseExercise[];
}

export function useExercisesByLanguage(languageId: string | null) {
  return useQuery({
    queryKey: ['course-exercises', languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*, skills(*)')
        .eq('language_id', languageId!)
        .eq('status', 'active')
        .order('difficulty_elo', { ascending: true });
      if (error) throw error;
      return data as unknown as CourseExercise[];
    },
  });
}

export function useExerciseCountsByLanguage() {
  return useQuery({
    queryKey: ['exercise-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('language_id, id')
        .eq('status', 'active');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(ex => {
        counts[ex.language_id] = (counts[ex.language_id] || 0) + 1;
      });
      return counts;
    },
  });
}

export function groupExercisesByCefr(exercises: CourseExercise[]): CourseLevel[] {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const grouped: Record<string, CourseExercise[]> = {};

  levels.forEach(l => { grouped[l] = []; });

  exercises.forEach(ex => {
    const level = mapEloToCefr(ex.difficulty_elo);
    if (grouped[level]) {
      grouped[level].push(ex);
    }
  });

  return levels
    .map(level => ({ level, exercises: grouped[level] }))
    .filter(g => g.exercises.length > 0);
}

export function useLessonsByLanguageCode(langCode: string | null) {
  return useQuery({
    queryKey: ['course-lessons', langCode],
    enabled: !!langCode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('language', langCode!)
        .eq('status', 'published')
        .order('level');
      if (error) throw error;
      return data;
    },
  });
}

export interface LessonsByLevel {
  level: string;
  lessons: any[];
}

export function groupLessonsByCefr(lessons: any[]): LessonsByLevel[] {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const grouped: Record<string, any[]> = {};
  levels.forEach(l => { grouped[l] = []; });
  lessons.forEach(lesson => {
    if (grouped[lesson.level]) {
      grouped[lesson.level].push(lesson);
    }
  });
  return levels
    .map(level => ({ level, lessons: grouped[level] }))
    .filter(g => g.lessons.length > 0);
}

export const CEFR_LABELS: Record<string, string> = {
  A1: 'Nybörjare',
  A2: 'Grundläggande',
  B1: 'Mellannivå',
  B2: 'Övre mellannivå',
  C1: 'Avancerad',
  C2: 'Mästerskap',
};
