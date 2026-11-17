import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { fetchOrderPayments, reviewManualPayment, type OrderPayment } from '@/lib/orderPaymentRepository';

export default function AdminOrderPayments({ orderId }: { orderId: string }) {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setPayments(await fetchOrderPayments(orderId)); }
    catch { setMessage('Payment records could not be loaded.'); }
  }, [orderId]);
  useEffect(() => { void load(); }, [load]);

  const review = async (id: string, decision: 'confirmed' | 'rejected') => {
    setBusyId(id); setMessage(null);
    try {
      await reviewManualPayment(id, decision, notes[id] ?? '');
      setMessage(decision === 'confirmed' ? 'Payment confirmed.' : 'Payment rejected.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment review could not be saved.');
    } finally { setBusyId(null); }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Manual payment verification</h3>
      {payments.length === 0 && <p className="text-sm text-navy-600">No payment submissions recorded.</p>}
      {payments.map((payment) => (
        <div key={payment.id} className="flex flex-col gap-3 rounded-xl bg-mist p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-navy-900">{payment.method === 'bank_transfer' ? 'Bank transfer' : 'Cash'} · {formatNaira(payment.amount_kobo / 100)}</p>
            <span className="text-xs font-bold uppercase text-navy-700">{payment.status.replace('_', ' ')}</span>
          </div>
          <dl className="grid grid-cols-1 gap-2 text-xs text-navy-700 sm:grid-cols-2">
            <div><dt className="font-semibold">Payment reference</dt><dd>{payment.reference}</dd></div>
            <div><dt className="font-semibold">Sender</dt><dd>{payment.sender_name || 'Not provided'}</dd></div>
            <div><dt className="font-semibold">Sender bank</dt><dd>{payment.sender_bank || 'Not provided'}</dd></div>
            <div><dt className="font-semibold">Transfer reference</dt><dd>{payment.transfer_reference || 'Not provided'}</dd></div>
            {payment.customer_note && <div className="sm:col-span-2"><dt className="font-semibold">Customer note</dt><dd>{payment.customer_note}</dd></div>}
            {payment.admin_note && <div className="sm:col-span-2"><dt className="font-semibold">Previous review note</dt><dd>{payment.admin_note}</dd></div>}
          </dl>
          {payment.status === 'awaiting_confirmation' && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-navy-800">Review note
                <textarea value={notes[payment.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [payment.id]: event.target.value }))} maxLength={500} rows={2} className="rounded-xl border border-navy-200 bg-white px-3 py-2" />
              </label>
              <p className="text-xs font-semibold text-amber-800">Verify the funds in the receiving account or confirm cash physically before approving.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void review(payment.id, 'confirmed')} disabled={busyId !== null} className="px-4 py-2 text-xs">{busyId === payment.id ? 'Saving...' : 'Confirm received'}</Button>
                <Button onClick={() => void review(payment.id, 'rejected')} disabled={busyId !== null} variant="outline" className="px-4 py-2 text-xs">Reject submission</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
