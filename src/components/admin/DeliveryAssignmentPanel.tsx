import { useEffect, useState, type FormEvent } from 'react';
import { Save, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from '@/components/layout/Link';
import { formatNaira } from '@/lib/format';
import {
  fetchAllDeliveryPartners,
  fetchOrderAssignment,
  removeOrderAssignment,
  saveOrderAssignment,
  type DeliveryPartner,
  type OrderAssignment,
} from '@/lib/deliveryPartnerRepository';

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

const MAX_FEE = 100000000;

interface DeliveryAssignmentPanelProps {
  orderId: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; partners: DeliveryPartner[]; assignment: OrderAssignment | null };

export default function DeliveryAssignmentPanel({ orderId }: DeliveryAssignmentPanelProps) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [partnerId, setPartnerId] = useState('');
  const [fee, setFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoad({ status: 'loading' });
    (async () => {
      try {
        const [partners, assignment] = await Promise.all([fetchAllDeliveryPartners(), fetchOrderAssignment(orderId)]);
        if (!active) return;
        setLoad({ status: 'ready', partners, assignment });
        setPartnerId(assignment?.partner_id ?? '');
        setFee(assignment ? String(assignment.fee) : '');
      } catch {
        if (active) setLoad({ status: 'error' });
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, reloadKey]);

  if (load.status === 'loading') return <p className="text-sm text-navy-700">Loading delivery assignment...</p>;
  if (load.status === 'error') {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
        The delivery assignment could not be loaded.
      </p>
    );
  }

  const { partners, assignment } = load;
  const activePartners = partners.filter((partner) => partner.active);
  const partnerName = (id: string) => partners.find((partner) => partner.id === id)?.full_name ?? 'Unknown partner';
  const isDelivered = assignment?.delivered_at != null;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedFee = fee.trim();
    if (!partnerId) {
      setMessage({ tone: 'error', text: 'Choose a delivery partner.' });
      return;
    }
    if (!/^\d+$/.test(trimmedFee) || Number(trimmedFee) > MAX_FEE) {
      setMessage({ tone: 'error', text: 'Enter the delivery fee as a whole number of naira.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await saveOrderAssignment(orderId, partnerId, Number(trimmedFee));
      setMessage({ tone: 'ok', text: 'Delivery assignment saved.' });
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await removeOrderAssignment(orderId);
      setConfirmRemove(false);
      setMessage({ tone: 'ok', text: 'Delivery assignment removed.' });
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl p-3 text-sm font-semibold ${
            message.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.text}
        </p>
      )}

      {assignment && isDelivered && (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Delivered by {partnerName(assignment.partner_id)} for {formatNaira(assignment.fee)}. The assignment is locked.
        </p>
      )}

      {!isDelivered && activePartners.length === 0 && (
        <p className="text-sm leading-relaxed text-navy-700">
          No active delivery partners yet. <Link to="/admin/partners" className="font-bold text-navy-900 underline">Add a delivery partner</Link> first.
        </p>
      )}

      {!isDelivered && activePartners.length > 0 && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
              Delivery partner
              <select value={partnerId} onChange={(event) => setPartnerId(event.target.value)} className={FIELD_CLASS}>
                <option value="">Choose a partner</option>
                {activePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
              Delivery fee (naira)
              <input
                type="text"
                inputMode="numeric"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                placeholder="e.g. 1500"
                className={FIELD_CLASS}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy} className="px-5 py-2.5 text-sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              {busy ? 'Saving...' : assignment ? 'Save assignment' : 'Assign order'}
            </Button>
            {assignment && !confirmRemove && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove assignment
              </button>
            )}
            {assignment && confirmRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="rounded-full bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Confirm remove
              </button>
            )}
          </div>
        </form>
      )}

      {assignment && !isDelivered && (
        <p className="text-xs text-navy-600">
          Currently with {partnerName(assignment.partner_id)} at {formatNaira(assignment.fee)}.
        </p>
      )}
      {!assignment && <p className="text-xs text-navy-600">Not assigned yet.</p>}
      {assignment && isDelivered && (
        <p className="text-xs text-navy-600">Assigned order can no longer be changed after delivery.</p>
      )}
    </div>
  );
}
