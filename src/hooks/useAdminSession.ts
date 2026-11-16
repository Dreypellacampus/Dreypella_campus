import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getInstitutionAdminAssignment, isAdminUser } from '@/lib/adminAuth';

export type AdminSessionState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'forbidden'; email: string }
  | { status: 'admin'; email: string }
  | { status: 'institution-admin'; email: string; institutionId: string; institutionName: string }
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
        if (await isAdminUser(session.user.id)) {
          if (active) setState({ status: 'admin', email });
          return;
        }

        const assignment = await getInstitutionAdminAssignment(session.user.id);
        if (!assignment) {
          if (active) setState({ status: 'forbidden', email });
          return;
        }

        const { data, error } = await client
          .from('institutions')
          .select('name')
          .eq('id', assignment.institution_id)
          .maybeSingle();
        if (error || !data) throw new Error('Assigned institution could not be loaded.');

        if (active) {
          setState({
            status: 'institution-admin',
            email,
            institutionId: assignment.institution_id,
            institutionName: data.name,
          });
        }
      } catch {
        if (active) setState({ status: 'error' });
      }
    };

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      void resolve(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
