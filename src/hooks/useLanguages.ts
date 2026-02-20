import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurriculumLanguage {
  code: string;
  name: string;
  flag_emoji: string;
}

/**
 * Load all available languages from the static JSON curriculum file.
 */
export function useLanguages() {
  return useQuery({
    queryKey: ['curriculum-languages'],
    queryFn: async (): Promise<CurriculumLanguage[]> => {
      const res = await fetch('/data/curriculum/languages.json');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: Infinity,
  });
}

/**
 * Ensure a language exists in the DB languages table (needed for user_language_profiles FK).
 * Returns the DB language row.
 */
export async function ensureLanguageInDB(lang: CurriculumLanguage) {
  // Check if exists
  const { data: existing } = await supabase
    .from('languages')
    .select('*')
    .eq('code', lang.code)
    .maybeSingle();
  if (existing) return existing;

  // Insert it
  const { data: created, error } = await supabase
    .from('languages')
    .insert({ code: lang.code, name: lang.name, flag_emoji: lang.flag_emoji })
    .select()
    .single();
  if (error) throw error;
  return created;
}

/** 4 core language skills */
export const CORE_SKILLS = ['listening', 'reading', 'speaking', 'writing'] as const;
export type CoreSkill = (typeof CORE_SKILLS)[number];

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*');
      if (error) throw error;
      // Filter to 4 core skills
      return (data || []).filter(s => CORE_SKILLS.includes(s.key as CoreSkill));
    },
  });
}

export function useCefrBands(languageId: string | null) {
  return useQuery({
    queryKey: ['cefr-bands', languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cefr_band_config')
        .select('*')
        .eq('language_id', languageId!)
        .order('band_min');
      if (error) throw error;
      return data;
    },
  });
}
