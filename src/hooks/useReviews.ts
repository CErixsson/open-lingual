import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Review = Tables<'reviews'>;

export function useReviewsBySubmission(submissionId: string | null) {
  return useQuery({
    queryKey: ['reviews', submissionId],
    enabled: !!submissionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('submission_id', submissionId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      reviewerId,
      decision,
      comments,
    }: {
      submissionId: string;
      reviewerId: string;
      decision: 'approve' | 'request_changes';
      comments: string;
    }) => {
      // Create the review
      const { error: reviewError } = await supabase.from('reviews').insert({
        submission_id: submissionId,
        reviewer_id: reviewerId,
        decision,
        comments,
      });
      if (reviewError) throw reviewError;

      // Update submission state
      const newState = decision === 'approve' ? 'approved' : 'changes_requested';
      const { error: subError } = await supabase
        .from('submissions')
        .update({ state: newState, reviewer_id: reviewerId })
        .eq('id', submissionId);
      if (subError) throw subError;

      // If approved, update lesson status
      if (decision === 'approve') {
        const { data: sub } = await supabase
          .from('submissions')
          .select('lesson_id')
          .eq('id', submissionId)
          .single();
        if (sub) {
          await supabase
            .from('lessons')
            .update({ status: 'approved' })
            .eq('id', sub.lesson_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}
