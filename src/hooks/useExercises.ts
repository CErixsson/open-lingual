import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRecommendedExercises(
  languageId: string | null,
  userElo?: number,
  skillId?: string | null
) {
  return useQuery({
    queryKey: ['recommended-exercises', languageId, userElo, skillId],
    enabled: !!languageId,
    queryFn: async () => {
      const targetElo = userElo || 1000;
      let query = supabase
        .from('exercises')
        .select('*, skills(*)')
        .eq('language_id', languageId!)
        .eq('status', 'active')
        .gte('difficulty_elo', targetElo - 200)
        .lte('difficulty_elo', targetElo + 200)
        .limit(6);

      if (skillId) {
        query = query.eq('skill_id', skillId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: ['exercise', exerciseId],
    enabled: !!exerciseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*, skills(*), languages(*)')
        .eq('id', exerciseId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
