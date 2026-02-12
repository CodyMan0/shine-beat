import { useEffect } from 'react';
import { supabase } from '@/shared';

export function useVisitorTracking() {
  useEffect(() => {
    if (sessionStorage.getItem('visited')) return;
    sessionStorage.setItem('visited', '1');

    supabase.from('visitors').insert({ visited_at: new Date().toISOString() }).then();
  }, []);
}
