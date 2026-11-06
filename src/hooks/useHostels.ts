import { useCallback, useEffect, useState } from 'react';
import { fetchHostels, type Hostel } from '@/lib/hostels';

export type HostelLoadStatus = 'loading' | 'ready' | 'error';

export function useHostels() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [status, setStatus] = useState<HostelLoadStatus>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setHostels(await fetchHostels());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { hostels, status, reload: load };
}
