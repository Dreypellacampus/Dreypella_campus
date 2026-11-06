import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { CustomerSessionContext, type CustomerSessionState, type CustomerSessionValue } from '@/hooks/useCustomerSession';
import { supabase } from '@/lib/supabase';

const SIGNED_OUT: CustomerSessionState = { status: 'signed-out', userId: null, email: '', recovering: false };

function sessionState(session: Session | null, recovering: boolean): CustomerSessionState {
  if (!session) return { ...SIGNED_OUT, recovering };
  return {
    status: 'signed-in',
    userId: session.user.id,
    email: session.user.email ?? '',
    recovering,
  };
}

export default function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomerSessionState>(() =>
    supabase ? { ...SIGNED_OUT, status: 'loading' } : SIGNED_OUT
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const { data } = client.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      setState((previous) => {
        if (event === 'PASSWORD_RECOVERY') return sessionState(session, true);
        const recovering = event === 'SIGNED_OUT' ? false : previous.recovering;
        return sessionState(session, recovering);
      });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const endRecovery = useCallback(() => setState((previous) => ({ ...previous, recovering: false })), []);

  const value = useMemo<CustomerSessionValue>(() => ({ ...state, endRecovery }), [state, endRecovery]);

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}
