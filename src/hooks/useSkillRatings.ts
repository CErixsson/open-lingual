import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSkillRatings(profileId: string | null) {
  return useQuery({
    queryKey: ['skill-ratings', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_skill_ratings')
        .select('*, skills(*)')
        .eq('user_language_profile_id', profileId!);
      if (error) throw error;
      return data;
    },
  });
}
