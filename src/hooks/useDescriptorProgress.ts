import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DescriptorStatus = 'not_started' | 'in_progress' | 'achieved' | 'mastered';

export interface DescriptorProgress {
  id: string;
  user_id: string;
  descriptor_id: number;
  language_id: string;
  status: DescriptorStatus;
  success_count: number;
  best_performance_score: number;
  last_grammar_accuracy: number;
  last_lexical_diversity: number;
  last_complexity_score: number;
  achieved_at: string | null;
  mastered_at: string | null;
}

export function useDescriptorProgress(userId: string | null, languageId?: string) {
  return useQuery({
    queryKey: ['descriptor-progress', userId, languageId],
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase
        .from('user_descriptor_progress')
        .select('*, cefr_descriptors(*)')
        .eq('user_id', userId!);
      if (languageId) q = q.eq('language_id', languageId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useDescriptorProgressByLevel(userId: string | null, languageId?: string) {
  return useQuery({
    queryKey: ['descriptor-progress-by-level', userId, languageId],
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase
        .from('user_descriptor_progress')
        .select('*, cefr_descriptors(level, descriptor_text, scale, activity)')
        .eq('user_id', userId!);
      if (languageId) q = q.eq('language_id', languageId);
      const { data, error } = await q;
      if (error) throw error;

      // Group by CEFR level
      const grouped: Record<string, typeof data> = {};
      for (const item of data || []) {
        const level = (item as any).cefr_descriptors?.level || 'Unknown';
        if (!grouped[level]) grouped[level] = [];
        grouped[level].push(item);
      }
      return grouped;
    },
  });
}

export function useLessonDescriptors(lessonId: string | null) {
  return useQuery({
    queryKey: ['lesson-descriptors', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_descriptor_map')
        .select('*, cefr_descriptors(*)')
        .eq('lesson_id', lessonId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertDescriptorProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (progress: {
      user_id: string;
      descriptor_id: number;
      language_id: string;
      status: DescriptorStatus;
      success_count: number;
      best_performance_score: number;
      last_grammar_accuracy: number;
      last_lexical_diversity: number;
      last_complexity_score: number;
      achieved_at?: string | null;
      mastered_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('user_descriptor_progress')
        .upsert(progress, { onConflict: 'user_id,descriptor_id,language_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptor-progress'] });
      queryClient.invalidateQueries({ queryKey: ['descriptor-progress-by-level'] });
    },
  });
}
