import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { PageShell } from '@/components/account/SignedOutPrompt';
import NotificationItem from '@/components/notifications/NotificationItem';
import Button from '@/components/ui/Button';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { fetchNotifications, markNotificationsRead, type NotificationRow } from '@/lib/notificationRepository';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; notifications: NotificationRow[] }
  | { status: 'error'; message: string };

export default function NotificationsPage() {
  const session = useCustomerSession();
  const userId = session.userId;
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [marking, setMarking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoad({ status: 'loading' });

    fetchNotifications()
      .then((notifications) => {
        if (active) setLoad({ status: 'ready', notifications });
      })
      .catch((caught: unknown) => {
        if (active) {
          setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
        }
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  if (!userId) {
    return (
      <PageShell>
        <p className="text-center text-sm text-navy-700">Checking your account...</p>
      </PageShell>
    );
  }

  const unreadIds = load.status === 'ready' ? load.notifications.filter((item) => item.read_at === null).map((item) => item.id) : [];

  const handleMarkAllRead = () => {
    setMarking(true);
    setActionError(null);
    markNotificationsRead(unreadIds)
      .then(() => setReloadKey((key) => key + 1))
      .catch((caught: unknown) => {
        setActionError(caught instanceof Error ? caught.message : 'Please try again.');
      })
      .finally(() => setMarking(false));
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <Bell className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-red-500">Notifications</p>
            <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Your updates</h1>
            <p className="text-sm leading-relaxed text-navy-700">
              Updates about your orders and quotations appear here.
            </p>
          </div>
          {unreadIds.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead} disabled={marking} className="px-5 py-2.5 text-sm">
              {marking ? 'Updating...' : `Mark ${unreadIds.length} as read`}
            </Button>
          )}
        </div>

        {actionError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {actionError}
          </p>
        )}

        {load.status === 'loading' && <p className="text-sm text-navy-700">Loading your notifications...</p>}

        {load.status === 'error' && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {load.message}
          </p>
        )}

        {load.status === 'ready' && load.notifications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-navy-200 bg-white p-6 sm:p-8">
            <p className="text-base font-bold text-navy-900">You have no notifications yet.</p>
            <p className="mt-2 text-sm text-navy-700">We will let you know here when your orders or quotations change.</p>
          </div>
        )}

        {load.status === 'ready' && load.notifications.length > 0 && (
          <ul className="flex flex-col gap-3">
            {load.notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
