import { useEffect } from 'react';
import AuthForm, { type AuthMode } from '@/components/account/AuthForm';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useLocation } from '@/hooks/useLocation';
import { isAdminUser } from '@/lib/adminAuth';
import { navigate, safeNextPath } from '@/lib/navigation';

interface AuthPageProps {
  mode: Exclude<AuthMode, 'forgot'>;
}

export default function AuthPage({ mode }: AuthPageProps) {
  const session = useCustomerSession();
  const location = useLocation();
  const requestedNext = new URLSearchParams(location.split('?')[1] ?? '').get('next');
  const next = safeNextPath(requestedNext);
  const signedIn = session.status === 'signed-in';
  const userId = session.userId;

  useEffect(() => {
    if (!signedIn || !userId) return;
    let active = true;

    (async () => {
      const admin = requestedNext ? false : await isAdminUser(userId).catch(() => false);
      if (active) navigate(admin ? '/admin' : next, { replace: true });
    })();

    return () => {
      active = false;
    };
  }, [signedIn, userId, next, requestedNext]);

  return (
    <PageShell>
      <AuthForm initialMode={mode} onDone={() => undefined} />
    </PageShell>
  );
}
