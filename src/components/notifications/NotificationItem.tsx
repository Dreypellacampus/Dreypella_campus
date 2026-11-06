import { Bell, CheckCheck } from 'lucide-react';
import { formatOrderDateTime } from '@/lib/individualOrderDisplay';
import type { NotificationRow } from '@/lib/notificationRepository';

interface NotificationItemProps {
  notification: NotificationRow;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const isUnread = notification.read_at === null;

  return (
    <li
      className={`flex items-start gap-4 rounded-2xl border p-5 transition ${
        isUnread ? 'border-red-200 bg-red-50/50' : 'border-navy-100 bg-white'
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUnread ? 'bg-red-500 text-white' : 'bg-navy-50 text-navy-600'
        }`}
      >
        {isUnread ? <Bell className="h-4 w-4" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-navy-900">{notification.title}</p>
          <time className="text-xs font-semibold text-navy-600" dateTime={notification.created_at}>
            {formatOrderDateTime(notification.created_at)}
          </time>
        </div>
        <p className="text-sm leading-relaxed text-navy-700">{notification.message}</p>
        {isUnread && <span className="sr-only">Unread</span>}
      </div>
    </li>
  );
}
