import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { BULK_STATUSES, type BulkStatus } from '@/lib/bulkOrder';
import { formatDeliveryLines } from '@/lib/deliveryLocation';
import { orderDetailLines, formatOrderDate } from '@/lib/individualOrderDisplay';
import { updateIndividualOrderNotes, updateIndividualOrderStatus, type IndividualOrderRow } from '@/lib/individualOrderRepository';
import DeliveryAssignmentPanel from '@/components/admin/DeliveryAssignmentPanel';
import QuotationEditor from '@/components/admin/QuotationEditor';
import ReferenceImageLink from '@/components/admin/ReferenceImageLink';
import OrderStatusHistory from '@/components/admin/OrderStatusHistory';

interface IndividualOrderDetailProps {
  order: IndividualOrderRow;
  onClose: () => void;
  onSaved: () => void;
  allowDeliveryAssignment?: boolean;
}

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function IndividualOrderDetail({ order, onClose, onSaved, allowDeliveryAssignment = true }: IndividualOrderDetailProps) {
  const [status, setStatus] = useState<BulkStatus>(order.status);
  const [cancellationReason, setCancellationReason] = useState(order.cancellation_reason ?? '');
  const [notes, setNotes] = useState(order.admin_notes ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesMessage, setNotesMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (status === 'Cancelled' && !cancellationReason.trim()) {
      setMessage({ tone: 'error', text: 'Add a reason before cancelling this order.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await updateIndividualOrderStatus(order.id, status, cancellationReason);
      setMessage({ tone: 'ok', text: 'Status saved.' });
      onSaved();
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Status could not be saved.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesBusy(true);
    setNotesMessage(null);
    try {
      await updateIndividualOrderNotes(order.id, notes);
      setNotesMessage({ tone: 'ok', text: 'Notes saved.' });
      onSaved();
    } catch (caught) {
      setNotesMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Notes could not be saved.' });
    } finally {
      setNotesBusy(false);
    }
  };

  return (
    <Dialog
      eyebrow={[order.customer_name, order.institution_name_snapshot].filter(Boolean).join(' · ')}
      title={order.reference}
      onClose={onClose}
      footer={
        <>
          <span className="text-xs text-navy-600">Placed {formatOrderDate(order.created_at)}</span>
          <Button onClick={handleSave} disabled={busy || status === order.status} className="px-6 py-3 text-sm">
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Saving...' : 'Save status'}
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
          {status === 'Cancelled' && (
            <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
              Cancellation reason (the customer can see this)
              <textarea
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                maxLength={500}
                rows={3}
                className={FIELD_CLASS}
              />
            </label>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Status history</h3>
          <OrderStatusHistory orderId={order.id} refreshKey={`${order.status}|${order.cancellation_reason ?? ''}`} />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Quotation</h3>
          <QuotationEditor orderId={order.id} />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Internal notes</h3>
          <p className="text-xs text-navy-600">Only admins can see these notes.</p>
          {notesMessage && (
            <p
              role={notesMessage.tone === 'error' ? 'alert' : 'status'}
              className={`rounded-2xl p-3 text-sm font-semibold ${
                notesMessage.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {notesMessage.text}
            </p>
          )}
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
            rows={4}
            aria-label="Internal notes"
            className={FIELD_CLASS}
          />
          <div>
            <Button variant="outline" onClick={handleSaveNotes} disabled={notesBusy} className="px-5 py-2.5 text-sm">
              {notesBusy ? 'Saving...' : 'Save notes'}
            </Button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Customer</h3>
          <dl className="mt-3 flex flex-col gap-2 text-sm text-navy-900">
            <p>
              <span className="font-semibold text-navy-600">Name: </span>
              {order.customer_name}
            </p>
            <p>
              <span className="font-semibold text-navy-600">WhatsApp: </span>
              {order.whatsapp}
            </p>
          </dl>
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Order</h3>
          <p className="mt-3 text-sm font-bold text-navy-900">{order.service_title}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-navy-800">
            {orderDetailLines(order).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {typeof order.details.reference_image === 'string' && (
            <div className="mt-3">
              <ReferenceImageLink path={order.details.reference_image} />
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Delivery</h3>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-navy-800">
            {formatDeliveryLines(order.delivery_location).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {allowDeliveryAssignment && <div className="mt-4"><DeliveryAssignmentPanel orderId={order.id} /></div>}
        </section>
      </div>
    </Dialog>
  );
}
