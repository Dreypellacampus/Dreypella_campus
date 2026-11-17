import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { fetchCampusPaymentSettings, saveCampusPaymentSettings, type CampusPaymentSettings } from '@/lib/orderPaymentRepository';

const EMPTY: Omit<CampusPaymentSettings, 'id'> = { bank_name: '', account_name: '', account_number: '', payment_instructions: '' };

export default function PaymentSettingsPage() {
  const [values, setValues] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCampusPaymentSettings().then((data) => {
      if (active) setValues({ bank_name: data.bank_name, account_name: data.account_name, account_number: data.account_number, payment_instructions: data.payment_instructions });
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Settings could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (field: keyof typeof EMPTY, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const save = async () => {
    if (values.bank_name.trim() && (!values.account_name.trim() || !values.account_number.trim())) {
      setMessage('Complete the account name and account number, or leave all bank fields blank.');
      return;
    }
    setBusy(true); setMessage(null);
    try {
      await saveCampusPaymentSettings(values);
      setMessage('Payment instructions saved. Customers will see the updated details.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Settings could not be saved.');
    } finally { setBusy(false); }
  };

  const fieldClass = 'w-full rounded-xl border border-navy-200 bg-white px-3 py-3 text-sm text-navy-900';
  return (
    <section className="flex max-w-2xl flex-col gap-5 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-red-500">Manual payments</p>
        <h2 className="mt-1 text-xl font-extrabold text-navy-900">Customer payment instructions</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">Set the official account customers should transfer to. Only the main administrator can change these details.</p>
      </div>
      {loading ? <p className="text-sm text-navy-600">Loading settings...</p> : (
        <>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Bank name<input value={values.bank_name} onChange={(e) => update('bank_name', e.target.value)} maxLength={100} className={fieldClass} /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Account name<input value={values.account_name} onChange={(e) => update('account_name', e.target.value)} maxLength={150} className={fieldClass} /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Account number<input value={values.account_number} onChange={(e) => update('account_number', e.target.value)} maxLength={30} className={fieldClass} /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-navy-900">Additional instructions<textarea value={values.payment_instructions} onChange={(e) => update('payment_instructions', e.target.value)} maxLength={1000} rows={4} className={fieldClass} placeholder="Include transfer narration guidance, payment timing or other instructions." /></label>
          <Button onClick={() => void save()} disabled={busy} className="self-start px-6 py-3 text-sm">{busy ? 'Saving...' : 'Save payment instructions'}</Button>
        </>
      )}
      {message && <p role="status" className="text-sm font-semibold text-navy-700">{message}</p>}
    </section>
  );
}
