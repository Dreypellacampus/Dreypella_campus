import { useState } from 'react';
import { ExternalLink, Save, Sparkles } from 'lucide-react';
import Button, { buttonStyles } from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { BULK_STATUSES, draftCustomerResponse, type BulkOrderRow, type BulkStatus } from '@/lib/bulkOrder';
import { updateBulkOrder } from '@/lib/bulkOrderRepository';
import { formatDeliveryLines } from '@/lib/deliveryLocation';
import { formatDisplayDate, formatNaira } from '@/lib/format';
import { priceLineItems } from '@/lib/pricing';
import { usePriceCatalog } from '@/hooks/usePriceCatalog';
import { buildCustomerChatUrl } from '@/lib/whatsapp';

interface BulkRequestDetailProps {
  order: BulkOrderRow;
  onClose: () => void;
  onSaved: () => void;
}

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="text-sm font-semibold text-navy-600 sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="whitespace-pre-line break-words text-sm font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

export default function BulkRequestDetail({ order, onClose, onSaved }: BulkRequestDetailProps) {
  const [status, setStatus] = useState<BulkStatus>(order.status);
  const [internalNotes, setInternalNotes] = useState(order.internal_notes ?? '');
  const [response, setResponse] = useState(order.customer_response ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const { state: priceState } = usePriceCatalog();
  const prices = priceState.status === 'ready' ? priceState.prices : [];
  const pricing = priceLineItems(order.items, prices);
  const priceText = (amount: number | null) => {
    if (priceState.status === 'loading') return 'Loading...';
    if (priceState.status === 'error') return 'Prices unavailable';
    return amount === null ? 'Request a Quote' : formatNaira(amount);
  };

  const handleSave = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await updateBulkOrder(order.id, {
        status,
        internal_notes: internalNotes.trim() || null,
        customer_response: response.trim() || null,
      });
      setMessage({ tone: 'ok', text: 'Changes saved.' });
      onSaved();
    } catch (caught) {
      setMessage({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Changes could not be saved.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      eyebrow={order.customer_name}
      title={order.reference}
      onClose={onClose}
      footer={
        <>
          <span className="text-xs text-navy-600">Submitted {formatDisplayDate(order.created_at.slice(0, 10))}</span>
          <Button onClick={handleSave} disabled={busy} className="px-6 py-3 text-sm">
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Saving...' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {message && (
          <p
            role={message.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-2xl p-4 text-sm font-semibold ${
              message.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {message.text}
          </p>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Status</h3>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as BulkStatus)}
            aria-label="Order status"
            className={FIELD_CLASS}
          >
            {BULK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Customer</h3>
          <dl className="mt-3 flex flex-col gap-3">
            <Detail label="Customer / organization" value={order.customer_name} />
            <Detail label="Contact person" value={order.contact_name} />
            <Detail label="WhatsApp" value={order.whatsapp} />
            {order.institution_name_snapshot && <Detail label="Institution" value={order.institution_name_snapshot} />}
            {order.organization && <Detail label="Department / hostel" value={order.organization} />}
            <Detail label="Service type" value={order.service_type} />
            <Detail label="Budget" value={order.budget ?? 'Not given'} />
          </dl>
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Items</h3>
          <ul className="mt-3 flex flex-col divide-y divide-navy-100">
            {order.items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-navy-900">
                    {item.name} <span className="text-navy-600">x {item.quantity}</span>
                  </p>
                  {item.specs && <p className="mt-1 text-sm text-navy-600">{item.specs}</p>}
                </div>
                <p className="text-sm font-bold text-navy-900">{priceText(pricing.lines[index].subtotal)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-bold text-navy-900">Total: {priceText(pricing.total)}</p>
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Delivery</h3>
          <dl className="mt-3 flex flex-col gap-3">
            <Detail label="Location" value={formatDeliveryLines(order.delivery_location).join('\n')} />
            <Detail label="Required date" value={formatDisplayDate(order.delivery_date)} />
            <Detail label="Required time" value={order.delivery_time} />
            {order.instructions && <Detail label="Instructions" value={order.instructions} />}
          </dl>
        </section>

        <section className="flex flex-col gap-3">
          <label htmlFor="internal-notes" className="text-sm font-extrabold uppercase tracking-wider text-red-500">
            Internal notes (not shared with the customer)
          </label>
          <textarea
            id="internal-notes"
            rows={3}
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            className={FIELD_CLASS}
          />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="customer-response" className="text-sm font-extrabold uppercase tracking-wider text-red-500">
              Customer response
            </label>
            <button
              type="button"
              onClick={() => setResponse(draftCustomerResponse({ ...order, status }))}
              className="inline-flex items-center gap-2 rounded-full border border-navy-200 px-3 py-1.5 text-xs font-bold text-navy-900 transition hover:bg-navy-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Draft from status
            </button>
          </div>
          <textarea
            id="customer-response"
            rows={5}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            className={FIELD_CLASS}
          />
          <a
            href={buildCustomerChatUrl(order.whatsapp, response)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles('outline', 'w-fit px-5 py-2.5 text-sm')}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open WhatsApp chat with customer
          </a>
        </section>
      </div>
    </Dialog>
  );
}
