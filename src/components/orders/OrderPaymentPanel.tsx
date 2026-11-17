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
      await submitManualOrderPayment({ orderId, senderName, senderBank, transferReference, customerNote: note });
      setMessage('Your bank transfer details have been submitted. An authorised administrator must verify the funds before your payment is confirmed.');
      setSenderName(''); setSenderBank(''); setTransferReference(''); setNote('');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment submission could not be completed.');
    } finally { setBusy(false); }
  };

  const pending = payments.some((payment) => payment.status === 'awaiting_confirmation');
  const fieldClass = 'rounded-xl border border-navy-200 px-3 py-3';
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white p-4" aria-label="Manual bank transfer payment">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Bank transfer payment</h3>
        <p className="mt-1 text-xs leading-relaxed text-navy-600">Pay only after approving your quotation. Your payment remains pending until Dreypella Campus verifies the funds in its bank account.</p>
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
          ) : <p className="text-navy-700">Bank details have not yet been configured by the main administrator.</p>}
          {settings.payment_instructions && <p className="mt-3 whitespace-pre-wrap text-navy-700">{settings.payment_instructions}</p>}
        </div>
      )}
      {payments.map((payment) => (
        <div key={payment.id} className="rounded-xl border border-navy-100 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-navy-900">Bank transfer · {formatNaira(payment.amount_kobo / 100)}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{payment.status.replace('_', ' ')}</span>
          </div>
          <p className="mt-1 text-xs text-navy-600">Submission reference: {payment.reference}</p>
          {payment.admin_note && <p className="mt-2 text-xs text-navy-700">Administrator note: {payment.admin_note}</p>}
        </div>
      ))}
      {pending ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Your transfer submission is awaiting administrator verification. Please do not submit it again.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="rounded-xl border border-navy-100 p-3 text-sm font-semibold text-navy-800">Accepted payment method: Bank transfer only.</p>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Account name used for transfer
            <input value={senderName} onChange={(event) => setSenderName(event.target.value)} maxLength={120} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Sender's bank (optional)
            <input value={senderBank} onChange={(event) => setSenderBank(event.target.value)} maxLength={100} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Transfer reference / narration
            <input value={transferReference} onChange={(event) => setTransferReference(event.target.value)} maxLength={160} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Additional note (optional)
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} className={fieldClass} />
          </label>
          <Button onClick={() => void submit()} disabled={busy} className="px-4 py-3 text-sm">{busy ? 'Submitting...' : 'Submit bank transfer for confirmation'}</Button>
        </div>
      )}
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
