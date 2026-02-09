import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Lesson = Tables<'lessons'>;
export type LessonInsert = TablesInsert<'lessons'>;
export type LessonUpdate = TablesUpdate<'lessons'>;

export function usePublishedLessons(language?: string) {
  return useQuery({
    queryKey: ['lessons', 'published', language],
    queryFn: async () => {
      let q = supabase.from('lessons').select('*').eq('status', 'published').order('level');
      if (language) q = q.eq('language', language);
      const { data, error } = await q;
      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export function useMyLessons(userId: string | null) {
  return useQuery({
    queryKey: ['lessons', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('author_id', userId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export function useLesson(id: string | null) {
  return useQuery({
    queryKey: ['lesson', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Lesson;
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: LessonInsert) => {
      const { data, error } = await supabase.from('lessons').insert(lesson).select().single();
      if (error) throw error;
      return data as Lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: LessonUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Lesson;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', data.id] });
    },
  });
}

export function useLessonsByStatus() {
  return useQuery({
    queryKey: ['lessons', 'all-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lesson[];
    },
  });
}
