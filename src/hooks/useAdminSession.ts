import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isAdminUser } from '@/lib/adminAuth';

export type AdminSessionState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'forbidden'; email: string }
  | { status: 'admin'; email: string }
  | { status: 'error' };

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>(() =>
    supabase ? { status: 'loading' } : { status: 'unconfigured' }
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    const resolve = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ status: 'signed-out' });
        return;
      }

      const email = session.user.email ?? '';
      if (active) setState({ status: 'loading' });

      try {
        const admin = await isAdminUser(session.user.id);
        if (active) setState(admin ? { status: 'admin', email } : { status: 'forbidden', email });
      } catch {
        if (active) setState({ status: 'error' });
      }
    };

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      (async () => {
        await resolve(session);
      })();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
