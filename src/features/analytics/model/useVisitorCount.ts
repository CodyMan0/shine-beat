import { useState, useEffect } from 'react';
import { supabase } from '@/shared';

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: total } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true });
        setCount(total);
      } catch {
        // Silently fail
      }
    };
    fetchCount();
  }, []);

  return count;
}
