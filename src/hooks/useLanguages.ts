import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*');
      if (error) throw error;
      return data;
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
