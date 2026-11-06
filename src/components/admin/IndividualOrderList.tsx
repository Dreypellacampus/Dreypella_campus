import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import IndividualOrderDetail from '@/components/admin/IndividualOrderDetail';
import { STATUS_STYLES } from '@/components/admin/statusStyles';
import { BULK_STATUSES, type BulkStatus } from '@/lib/bulkOrder';
import { fetchIndividualOrders, type IndividualOrderRow } from '@/lib/individualOrderRepository';
import { formatOrderDate } from '@/lib/individualOrderDisplay';

type LoadState = 'loading' | 'ready' | 'error';

export default function IndividualOrderList() {
  const [orders, setOrders] = useState<IndividualOrderRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [filter, setFilter] = useState<BulkStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setOrders(await fetchIndividualOrders());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'All' ? orders : orders.filter((order) => order.status === filter);
  const selected = orders.find((order) => order.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-bold text-navy-900">
          Status
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as BulkStatus | 'All')}
            className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
          >
            <option value="All">All orders ({orders.length})</option>
            {BULK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-navy-200 px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-navy-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {loadState === 'loading' && <p className="text-sm text-navy-700">Loading individual orders...</p>}

      {loadState === 'error' && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Individual orders could not be loaded. Check the database connection and try refreshing.
        </p>
      )}

      {loadState === 'ready' && visible.length === 0 && (
        <p className="rounded-2xl bg-mist p-6 text-center text-sm text-navy-700">No individual orders here yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => setSelectedId(order.id)}
              className="flex w-full flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold tracking-wide text-navy-900">{order.reference}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-base font-bold text-navy-900">{order.customer_name}</p>
              <p className="text-sm text-navy-700">
                {order.service_title} | Placed {formatOrderDate(order.created_at)}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <IndividualOrderDetail
          key={selected.id}
          order={selected}
          onClose={() => setSelectedId(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
