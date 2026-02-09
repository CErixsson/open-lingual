import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Submission = Tables<'submissions'>;

export function useMySubmissions(userId: string | null) {
  return useQuery({
    queryKey: ['submissions', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, lessons(title, language, level)')
        .eq('author_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingSubmissions() {
  return useQuery({
    queryKey: ['submissions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, lessons(title, language, level, description, objectives, exercises, author_id)')
        .eq('state', 'submitted')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, authorId, notes }: { lessonId: string; authorId: string; notes?: string }) => {
      // Update lesson status to in_review
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({ status: 'in_review' })
        .eq('id', lessonId);
      if (lessonError) throw lessonError;

      const { data, error } = await supabase
        .from('submissions')
        .insert({ lesson_id: lessonId, author_id: authorId, notes })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, state, reviewerId }: { id: string; state: string; reviewerId?: string }) => {
      const { error } = await supabase
        .from('submissions')
        .update({ state, reviewer_id: reviewerId })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
