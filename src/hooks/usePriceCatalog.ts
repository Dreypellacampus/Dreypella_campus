import { useCallback, useEffect, useState } from 'react';
import { fetchPriceItems, type PriceItem } from '@/lib/priceRepository';

export type PriceCatalogState =
  | { status: 'loading' }
  | { status: 'ready'; prices: PriceItem[] }
  | { status: 'error' };

export function usePriceCatalog() {
  const [state, setState] = useState<PriceCatalogState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', prices: await fetchPriceItems() });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
