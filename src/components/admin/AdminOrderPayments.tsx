import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { confirmCashPayment, fetchOrderPayments, type OrderPayment } from '@/lib/orderPaymentRepository';

export default function AdminOrderPayments({ orderId }: { orderId: string }) {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setPayments(await fetchOrderPayments(orderId)); }
    catch { setMessage('Payment records could not be loaded.'); }
  }, [orderId]);
  useEffect(() => { void load(); }, [load]);

  const confirm = async (id: string) => {
    setBusyId(id); setMessage(null);
    try {
      await confirmCashPayment(id);
      setMessage('Cash receipt confirmed.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cash receipt could not be confirmed.');
    } finally { setBusyId(null); }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Payments</h3>
      {payments.length === 0 && <p className="text-sm text-navy-600">No payment attempts recorded.</p>}
      {payments.map((payment) => (
        <div key={payment.id} className="flex flex-col gap-2 rounded-xl bg-mist p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-bold text-navy-900">{payment.method === 'paystack' ? 'Online (Paystack)' : 'Cash'} · {formatNaira(payment.amount_kobo / 100)}</p>
            <p className="text-navy-600">Status: {payment.status.replace('_', ' ')}</p>
            <p className="text-xs text-navy-500">Ref: {payment.reference}</p>
          </div>
          {payment.method === 'cash' && payment.status === 'awaiting_cash' && (
            <Button onClick={() => void confirm(payment.id)} disabled={busyId !== null} className="px-4 py-2 text-xs">
              {busyId === payment.id ? 'Saving...' : 'Confirm cash received'}
            </Button>
          )}
        </div>
      ))}
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
