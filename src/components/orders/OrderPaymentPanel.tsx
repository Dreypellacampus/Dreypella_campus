import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { chooseCashPayment, fetchOrderPayments, startOnlinePayment, verifyOnlinePayment, type OrderPayment } from '@/lib/orderPaymentRepository';

export default function OrderPaymentPanel({ orderId }: { orderId: string }) {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setPayments(await fetchOrderPayments(orderId)); } catch { setMessage('Payment records are not available yet.'); }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('payment_reference');
    if (!reference) return;
    let active = true;
    setBusy(true);
    void verifyOnlinePayment(reference)
      .then((result) => {
        if (!active) return;
        setMessage(result.status === 'successful' ? 'Payment verified successfully.' : (result.message || 'Payment is still awaiting confirmation.'));
        void load();
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Payment verification could not be completed.');
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [load]);

  const online = async () => {
    setBusy(true); setMessage(null);
    try {
      const result = await startOnlinePayment(orderId);
      window.location.assign(result.authorization_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Online checkout could not be started.');
      setBusy(false);
    }
  };

  const cash = async () => {
    setBusy(true); setMessage(null);
    try {
      await chooseCashPayment(orderId);
      setMessage('Cash payment selected. Your order will remain awaiting cash confirmation from the Dreypella Campus team.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cash payment could not be selected.');
    } finally { setBusy(false); }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4" aria-label="Order payment">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Payment</h3>
        <p className="mt-1 text-xs leading-relaxed text-navy-600">Pay only after approving the quotation. Online payments are verified with Paystack; cash remains pending until staff confirm receipt.</p>
      </div>
      {payments.map((payment) => (
        <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mist p-3 text-sm">
          <span className="font-semibold text-navy-900">{payment.method === 'paystack' ? 'Online payment' : 'Cash payment'} · {formatNaira(payment.amount_kobo / 100)}</span>
          <span className="font-bold text-navy-700">{payment.status.replace('_', ' ')}</span>
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={online} disabled={busy} className="px-4 py-2.5 text-sm">{busy ? 'Please wait...' : 'Pay online'}</Button>
        <Button onClick={cash} disabled={busy} variant="outline" className="px-4 py-2.5 text-sm">Choose cash</Button>
      </div>
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
