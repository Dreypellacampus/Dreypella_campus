import { useEffect, useState } from 'react';
import { formatOrderDateTime } from '@/lib/individualOrderDisplay';
import { fetchOrderStatusEvents, type OrderStatusEvent } from '@/lib/individualOrderRepository';

interface OrderStatusHistoryProps {
  orderId: string;
  refreshKey: string;
}

export default function OrderStatusHistory({ orderId, refreshKey }: OrderStatusHistoryProps) {
  const [events, setEvents] = useState<OrderStatusEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await fetchOrderStatusEvents(orderId);
        if (active) {
          setEvents(next);
          setError(null);
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Status history could not be loaded.');
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, refreshKey]);

  if (error) {
    return (
      <p role="alert" className="text-sm font-semibold text-red-600">
        {error}
      </p>
    );
  }

  if (events === null) return <p className="text-sm text-navy-700">Loading history...</p>;

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event, index) => (
        <li key={`${event.created_at}-${index}`} className="flex flex-col gap-1 border-l-2 border-navy-100 pl-4">
          <span className="text-sm font-bold text-navy-900">{event.status}</span>
          <span className="text-xs text-navy-600">{formatOrderDateTime(event.created_at)}</span>
          {event.reason && <span className="text-sm text-navy-800">Reason: {event.reason}</span>}
        </li>
      ))}
    </ol>
  );
}
