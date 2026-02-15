import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DialogueMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DialogueEvaluation {
  grammar_accuracy: number;
  lexical_complexity: number;
  fluency: number;
  register: number;
  compositeScore: number;
  corrections: string[];
}

export interface RatingDelta {
  before: number;
  after: number;
  delta: number;
  skillName: string;
}

export function useDialogue() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<DialogueEvaluation | null>(null);
  const [lastRatingDeltas, setLastRatingDeltas] = useState<Record<string, RatingDelta> | null>(null);
  const [options, setOptions] = useState<any[] | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [userCefr, setUserCefr] = useState<string>('A2');

  const callDialogue = useCallback(async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dialogue`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 429) {
        toast.error('Rate limited. Please wait a moment and try again.');
        throw new Error('Rate limited');
      }
      if (response.status === 402) {
        toast.error('AI credits exhausted. Please add funds in Settings.');
        throw new Error('Payment required');
      }
      throw new Error(err.error || 'Dialogue error');
    }

    return response.json();
  }, []);

  const startSession = useCallback(async (scenarioId: string, mode: string) => {
    setIsLoading(true);
    setMessages([]);
    setLastEvaluation(null);
    setLastRatingDeltas(null);
    try {
      const data = await callDialogue({ action: 'start', scenarioId, mode });
      setSessionId(data.session.id);
      setMessages([{ role: 'assistant', content: data.aiMessage }]);
      setOptions(data.options);
      setHints(data.hints || []);
      setUserCefr(data.userCefr);
      return data;
    } catch (e: any) {
      toast.error(e.message || 'Failed to start dialogue');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [callDialogue]);

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const data = await callDialogue({ action: 'respond', sessionId, message });
      setMessages(prev => [...prev, { role: 'assistant', content: data.aiReply }]);
      setLastEvaluation(data.evaluation);
      setLastRatingDeltas(data.ratingDeltas);
      setUserCefr(data.userCefr);
      setOptions(null);
      return data;
    } catch (e: any) {
      // Remove the optimistic user message
      setMessages(prev => prev.slice(0, -1));
      toast.error(e.message || 'Failed to send message');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, callDialogue]);

  const completeSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await callDialogue({ action: 'complete', sessionId });
      toast.success('Session completed!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, callDialogue]);

  return {
    sessionId,
    messages,
    isLoading,
    lastEvaluation,
    lastRatingDeltas,
    options,
    hints,
    userCefr,
    startSession,
    sendMessage,
    completeSession,
  };
}
