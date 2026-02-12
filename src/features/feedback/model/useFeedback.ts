import { useState, useCallback } from 'react';
import { supabase } from '@/shared';

interface UseFeedbackReturn {
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  submitFeedback: (name: string, message: string) => Promise<void>;
  reset: () => void;
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(async (name: string, message: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('feedback')
        .insert({ name: name.trim() || null, message: message.trim() });

      if (dbError) throw dbError;
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitted(false);
    setError(null);
  }, []);

  return { isSubmitting, isSubmitted, error, submitFeedback, reset };
}
