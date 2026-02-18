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
  try {
    const res = await fetch(`/data/curriculum/lessons/${lang}/${level}/index.json`);
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchCurriculumLesson(lang: string, level: string, file: string): Promise<CurriculumLesson | null> {
  try {
    const res = await fetch(`/data/curriculum/lessons/${lang}/${level}/${file}`);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useCurriculumLessons(lang: string | null, level?: string) {
  return useQuery({
    queryKey: ['curriculum-lessons', lang, level],
    enabled: !!lang,
    queryFn: async () => {
      const levels = level ? [level] : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const allLessons: CurriculumLesson[] = [];

      // Fetch all level indexes in parallel
      const indexResults = await Promise.all(
        levels.map(lvl => fetchCurriculumIndex(lang!, lvl).then(files => ({ lvl, files })))
      );

      // Fetch all lessons in parallel
      const lessonPromises = indexResults.flatMap(({ lvl, files }) =>
        files.map(f => fetchCurriculumLesson(lang!, lvl, f))
      );
      const lessons = await Promise.all(lessonPromises);
      allLessons.push(...lessons.filter(Boolean) as CurriculumLesson[]);

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
      const lessons = await Promise.all(files.map(f => fetchCurriculumLesson(lang!, level!, f)));
      return lessons.find(l => l && l.id === lessonId) ?? null;
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
