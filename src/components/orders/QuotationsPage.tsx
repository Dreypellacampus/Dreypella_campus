import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { PageShell } from '@/components/account/SignedOutPrompt';
import QuotationPanel from '@/components/orders/QuotationPanel';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { fetchIndividualOrders, type IndividualOrderRow } from '@/lib/individualOrderRepository';
import { fetchQuotations, type Quotation } from '@/lib/quotationRepository';

interface QuotedOrder {
  order: IndividualOrderRow;
  quotation: Quotation;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; items: QuotedOrder[] }
  | { status: 'error'; message: string };

export default function QuotationsPage() {
  const session = useCustomerSession();
  const userId = session.userId;
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoad({ status: 'loading' });

    (async () => {
      try {
        const [orders, quotations] = await Promise.all([fetchIndividualOrders(), fetchQuotations()]);
        if (!active) return;
        const ordersById = new Map(orders.map((order) => [order.id, order]));
        const items = quotations.flatMap((quotation) => {
          const order = ordersById.get(quotation.order_id);
          return order ? [{ order, quotation }] : [];
        });
        setLoad({ status: 'ready', items });
      } catch (caught) {
        if (active) {
          setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
        }
      }
    })();

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

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">Quotations</p>
          <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Your quotations</h1>
          <p className="text-sm leading-relaxed text-navy-700">
            Approve, decline or ask a question about the prices we send for your orders.
          </p>
        </div>

        {load.status === 'loading' && <p className="text-sm text-navy-700">Loading your quotations...</p>}

        {load.status === 'error' && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            Your quotations could not be loaded. {load.message}
          </p>
        )}

        {load.status === 'ready' && load.items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-navy-200 bg-white p-6 sm:p-8">
            <p className="text-base font-bold text-navy-900">You have no quotations yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-navy-700">
              When we price one of your orders, the quotation will appear here.
            </p>
          </div>
        )}

        {load.status === 'ready' && load.items.length > 0 && (
          <ul className="flex flex-col gap-4">
            {load.items.map(({ order, quotation }) => (
              <li
                key={quotation.id}
                className="flex flex-col gap-4 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-extrabold text-navy-900">{order.service_title}</h2>
                  <span className="text-sm font-semibold tracking-wide text-navy-700">{order.reference}</span>
                </div>
                <QuotationPanel quotation={quotation} onResponded={() => setReloadKey((key) => key + 1)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
