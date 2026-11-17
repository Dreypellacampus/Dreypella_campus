import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { fetchCampusPaymentSettings, fetchOrderPayments, submitManualOrderPayment, type CampusPaymentSettings, type OrderPayment } from '@/lib/orderPaymentRepository';

export default function OrderPaymentPanel({ orderId }: { orderId: string }) {
  const [settings, setSettings] = useState<CampusPaymentSettings | null>(null);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [paymentRows, paymentSettings] = await Promise.all([fetchOrderPayments(orderId), fetchCampusPaymentSettings()]);
      setPayments(paymentRows);
      setSettings(paymentSettings);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment details could not be loaded.');
    }
  }, [orderId]);
  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!senderName.trim() || !transferReference.trim()) {
      setMessage('Enter the sender name and bank transfer reference.');
      return;
    }
    setBusy(true); setMessage(null);
    try {
      await submitManualOrderPayment({
        orderId, method: 'bank_transfer', senderName, senderBank, transferReference, customerNote: note,
      });
      setMessage('Your payment details have been submitted. Your order will remain awaiting confirmation until an authorised Dreypella Campus administrator verifies receipt.');
      setSenderName(''); setSenderBank(''); setTransferReference(''); setNote('');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment submission could not be completed.');
    } finally { setBusy(false); }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white p-4" aria-label="Manual order payment">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Manual payment</h3>
        <p className="mt-1 text-xs leading-relaxed text-navy-600">Make payment only after approving your quotation. Submitting payment details does not mean payment has been received or confirmed.</p>
      </div>
      {settings && (
        <div className="rounded-xl bg-mist p-4 text-sm">
          <p className="mb-2 font-extrabold text-navy-900">Dreypella Campus bank details</p>
          {settings.bank_name || settings.account_name || settings.account_number ? (
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-navy-500">Bank</dt><dd className="font-bold text-navy-900">{settings.bank_name || 'Not provided'}</dd></div>
              <div><dt className="text-xs text-navy-500">Account name</dt><dd className="font-bold text-navy-900">{settings.account_name || 'Not provided'}</dd></div>
              <div><dt className="text-xs text-navy-500">Account number</dt><dd className="font-bold text-navy-900">{settings.account_number || 'Not provided'}</dd></div>
            </dl>
          ) : <p className="text-navy-700">Bank transfer details will be displayed here once configured by the administrator.</p>}
          {settings.payment_instructions && <p className="mt-3 whitespace-pre-wrap text-navy-700">{settings.payment_instructions}</p>}
        </div>
      )}
      {payments.map((payment) => (
        <div key={payment.id} className="rounded-xl border border-navy-100 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-navy-900">{payment.method === 'bank_transfer' ? 'Bank transfer' : 'Cash'} · {formatNaira(payment.amount_kobo / 100)}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{payment.status.replace('_', ' ')}</span>
          </div>
          <p className="mt-1 text-xs text-navy-600">Reference: {payment.reference}</p>
          {payment.admin_note && <p className="mt-2 text-xs text-navy-700">Administrator note: {payment.admin_note}</p>}
        </div>
      ))}
      {payments.some((payment) => payment.status === 'awaiting_confirmation') ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">A payment submission is awaiting administrator verification. Please do not submit it again.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">
            Payment method
            <select value={method} onChange={(event) => setMethod(event.target.value as 'bank_transfer' | 'cash')} className="w-full rounded-xl border border-navy-200 bg-white px-3 py-3">
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash payment</option>
            </select>
          </label>
          {method === 'bank_transfer' && (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Account name used for transfer
                <input value={senderName} onChange={(event) => setSenderName(event.target.value)} maxLength={120} className="rounded-xl border border-navy-200 px-3 py-3" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Sender's bank (optional)
                <input value={senderBank} onChange={(event) => setSenderBank(event.target.value)} maxLength={100} className="rounded-xl border border-navy-200 px-3 py-3" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Transfer reference / narration
                <input value={transferReference} onChange={(event) => setTransferReference(event.target.value)} maxLength={160} className="rounded-xl border border-navy-200 px-3 py-3" />
              </label>
            </>
          )}
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Additional note (optional)
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} className="rounded-xl border border-navy-200 px-3 py-3" />
          </label>
          <Button onClick={() => void submit()} disabled={busy} className="px-4 py-3 text-sm">{busy ? 'Submitting...' : 'Submit payment details for confirmation'}</Button>
        </div>
      )}
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
