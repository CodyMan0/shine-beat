import { useEffect } from 'react';
import { supabase } from '@/shared';

export function useVisitorTracking() {
  useEffect(() => {
    if (sessionStorage.getItem('visited')) return;

    const trackVisit = async () => {
      try {
        await supabase.from('visitors').insert({ visited_at: new Date().toISOString() });
        sessionStorage.setItem('visited', '1');
      } catch {
        // Silently fail - analytics should never break the app
      }
    };
    trackVisit();
  }, []);
}
