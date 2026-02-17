import { useQuery } from '@tanstack/react-query';

export interface CurriculumExercise {
  type: 'vocabulary_intro' | 'multiple_choice' | 'translate' | 'match_pairs' | 'fill_blank' | 'word_order';
  // vocabulary_intro
  items?: { word: string; translation: string; example?: string }[];
  // multiple_choice
  prompt?: string;
  options?: string[];
  correct?: number;
  // translate
  source?: string;
  answer?: string;
  alternatives?: string[];
  // match_pairs
  pairs?: { left: string; right: string }[];
  // fill_blank
  sentence?: string;
  // word_order
  words?: string[];
  correct_order?: number[];
}

export interface CurriculumLesson {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  module_id: string;
  descriptor_ids: string[];
  xp: number;
  exercises: CurriculumExercise[];
}

async function fetchCurriculumIndex(lang: string, level: string): Promise<string[]> {
  const res = await fetch(`/data/curriculum/lessons/${lang}/${level}/index.json`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchCurriculumLesson(lang: string, level: string, file: string): Promise<CurriculumLesson | null> {
  const res = await fetch(`/data/curriculum/lessons/${lang}/${level}/${file}`);
  if (!res.ok) return null;
  return res.json();
}

export function useCurriculumLessons(lang: string | null, level?: string) {
  return useQuery({
    queryKey: ['curriculum-lessons', lang, level],
    enabled: !!lang,
    queryFn: async () => {
      const levels = level ? [level] : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const allLessons: CurriculumLesson[] = [];

      for (const lvl of levels) {
        const files = await fetchCurriculumIndex(lang!, lvl);
        const lessonPromises = files.map(f => fetchCurriculumLesson(lang!, lvl, f));
        const lessons = await Promise.all(lessonPromises);
        allLessons.push(...lessons.filter(Boolean) as CurriculumLesson[]);
      }

      return allLessons;
    },
  });
}

export function useCurriculumLesson(lang: string | null, level: string | null, lessonId: string | null) {
  return useQuery({
    queryKey: ['curriculum-lesson', lang, level, lessonId],
    enabled: !!lang && !!level && !!lessonId,
    queryFn: async () => {
      const files = await fetchCurriculumIndex(lang!, level!);
      for (const file of files) {
        const lesson = await fetchCurriculumLesson(lang!, level!, file);
        if (lesson && lesson.id === lessonId) return lesson;
      }
      return null;
    },
  });
}

export function useSkillModules() {
  return useQuery({
    queryKey: ['skill-modules'],
    queryFn: async () => {
      const res = await fetch('/data/curriculum/skill-modules.json');
      if (!res.ok) return { modules: [] };
      return res.json();
    },
  });
}
