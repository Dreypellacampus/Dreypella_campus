import { useEffect, type ReactNode } from 'react';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useLocation } from '@/hooks/useLocation';
import { navigate } from '@/lib/navigation';

interface RequireCustomerProps {
  children: ReactNode;
}

export default function RequireCustomer({ children }: RequireCustomerProps) {
  const session = useCustomerSession();
  const location = useLocation();
  const signedOut = session.status === 'signed-out';

  useEffect(() => {
    if (signedOut) navigate(`/login?next=${encodeURIComponent(location)}`, { replace: true });
  }, [signedOut, location]);

  if (session.status === 'signed-in') return children;

  return (
    <PageShell>
      <p className="text-center text-sm text-navy-700">Checking your account...</p>
    </PageShell>
  );
}
