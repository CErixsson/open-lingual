import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useScenarios(languageId: string | null) {
  return useQuery({
    queryKey: ['scenarios', languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*, scenario_packs(*)')
        .eq('language_id', languageId!)
        .eq('status', 'active')
        .order('scenario_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useScenarioPacks(languageId: string | null) {
  return useQuery({
    queryKey: ['scenario-packs', languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenario_packs')
        .select('*, scenarios(count)')
        .eq('language_id', languageId!)
        .order('pack_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useScenarioProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scenario-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_scenario_progress')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });
}
