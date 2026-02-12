import { useEffect } from 'react';
import { supabase } from '@/shared';

export function useVisitorTracking() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await supabase.from('visitors').insert({ visited_at: new Date().toISOString() });
      } catch {
        // Silently fail - analytics should never break the app
      }
    };
    trackVisit();
  }, []);
}
