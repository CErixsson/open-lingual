import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useLanguageProfile(languageId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['language-profile', user?.id, languageId],
    enabled: !!user && !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_language_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .eq('language_id', languageId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUserLanguageProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all-language-profiles', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_language_profiles')
        .select('*, languages(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteLanguageProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      // Delete skill ratings first
      await supabase.from('user_skill_ratings').delete().eq('user_language_profile_id', profileId);
      // Delete exercise attempts
      await supabase.from('exercise_attempts').delete().eq('user_language_profile_id', profileId);
      // Delete the profile itself
      const { error } = await supabase
        .from('user_language_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['language-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-language-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['skill-ratings'] });
    },
  });
}

export function useCreateLanguageProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (languageId: string) => {
      const { data: profile, error } = await supabase
        .from('user_language_profiles')
        .insert({ user_id: user!.id, language_id: languageId })
        .select()
        .single();
      if (error) throw error;

      // Create skill ratings for all 6 skills
      const { data: skills } = await supabase.from('skills').select('id');
      if (skills) {
        const ratings = skills.map(s => ({
          user_language_profile_id: profile.id,
          skill_id: s.id,
        }));
        await supabase.from('user_skill_ratings').insert(ratings);
      }

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['language-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-language-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['skill-ratings'] });
    },
  });
}
