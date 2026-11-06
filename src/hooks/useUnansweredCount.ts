import { useCallback, useEffect, useState } from 'react';
import { fetchUnansweredCount } from '@/lib/enquiryRepository';

const REFRESH_INTERVAL_MS = 30000;

export function useUnansweredCount(enabled: boolean): { count: number | null; reload: () => void } {
  const [count, setCount] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchUnansweredCount()
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => {
        if (active) setCount(null);
      });
    return () => {
      active = false;
    };
  }, [enabled, reloadKey]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(reload, REFRESH_INTERVAL_MS);
    window.addEventListener('focus', reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', reload);
    };
  }, [enabled, reload]);

  return { count, reload };
}
