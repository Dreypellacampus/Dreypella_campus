import { useEffect, useState } from 'react';
import { History, MessageCircle, Package } from 'lucide-react';
import { PageShell } from '@/components/account/SignedOutPrompt';
import Button, { buttonStyles } from '@/components/ui/Button';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { formatDeliveryLines } from '@/lib/deliveryLocation';
import { formatOrderDate, orderDetailLines } from '@/lib/individualOrderDisplay';
import { fetchIndividualOrders, type IndividualOrderRow } from '@/lib/individualOrderRepository';
import { fetchQuotations, type Quotation } from '@/lib/quotationRepository';
import { navigate } from '@/lib/navigation';
import { buildWhatsAppUrl, WHATSAPP_CHAT_URL } from '@/lib/whatsapp';
import QuotationPanel from '@/components/orders/QuotationPanel';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; orders: IndividualOrderRow[]; quotationsByOrder: Record<string, Quotation> }
  | { status: 'error'; message: string };

export default function MyOrdersPage() {
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
        if (active) {
          const quotationsByOrder = Object.fromEntries(quotations.map((quotation) => [quotation.order_id, quotation]));
          setLoad({ status: 'ready', orders, quotationsByOrder });
        }
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
            <History className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">My orders</p>
          <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Your individual orders</h1>
          <p className="text-sm leading-relaxed text-navy-700">
            Bulk requests are not shown here yet. Keep the reference number you were given for any bulk request.
          </p>
        </div>

        {load.status === 'loading' && <p className="text-sm text-navy-700">Loading your orders...</p>}

        {load.status === 'error' && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            Your orders could not be loaded. {load.message}
          </p>
        )}

        {load.status === 'ready' && load.orders.length === 0 && (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-navy-200 bg-white p-6 sm:p-8">
            <p className="text-base font-bold text-navy-900">You have not placed an order yet.</p>
            <Button onClick={() => navigate('/order')} className="px-6 py-3 text-sm">
              Place an order
            </Button>
          </div>
        )}

        {load.status === 'ready' && load.orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {load.orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-4 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
                      {formatOrderDate(order.created_at)}
                    </span>
                    <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
                      <Package className="h-4 w-4 text-red-500" aria-hidden="true" />
                      {order.service_title}
                    </h2>
                    <span className="text-sm font-semibold tracking-wide text-navy-700">{order.reference}</span>
                  </div>
                  <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-900">
                    {order.status}
                  </span>
                </div>

                {order.id in load.quotationsByOrder && (
                  <QuotationPanel
                    quotation={load.quotationsByOrder[order.id]}
                    onResponded={() => setReloadKey((key) => key + 1)}
                  />
                )}

                <a
                  href={buildWhatsAppUrl(`Hello Dreypella, I have a question about my order ${order.reference} (${order.service_title}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-navy-900 underline-offset-4 hover:underline"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Message us about this order
                </a>

                {order.status === 'Cancelled' && order.cancellation_reason && (
                  <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                    This order was cancelled. Reason: {order.cancellation_reason}
                  </p>
                )}

                <div className="grid gap-4 text-sm leading-relaxed text-navy-800 sm:grid-cols-2">
                  <div>
                    <p className="font-bold text-navy-900">Order details</p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {orderDetailLines(order).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">Delivery location</p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {formatDeliveryLines(order.delivery_location).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <a href={WHATSAPP_CHAT_URL} target="_blank" rel="noopener noreferrer" className={buttonStyles('outline', 'w-full sm:w-auto')}>
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Message us on WhatsApp
        </a>
      </div>
    </PageShell>
  );
}
