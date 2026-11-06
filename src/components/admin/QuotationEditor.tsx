import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { fetchQuotations, saveQuotation, type Quotation } from '@/lib/quotationRepository';

interface QuotationEditorProps {
  orderId: string;
}

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

const MAX_AMOUNT = 100_000_000;

export default function QuotationEditor({ orderId }: QuotationEditorProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [amount, setAmount] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const applyQuotation = (next: Quotation | null) => {
    setQuotation(next);
    setAmount(next ? String(next.amount) : '');
    setSummary(next?.summary ?? '');
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await fetchQuotations();
        if (!active) return;
        applyQuotation(all.find((item) => item.order_id === orderId) ?? null);
        setLoadError(null);
      } catch (caught) {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Quotation could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  const parsedAmount = Number(amount);
  const amountValid = amount.trim() !== '' && Number.isInteger(parsedAmount) && parsedAmount >= 0 && parsedAmount <= MAX_AMOUNT;
  const summaryValid = summary.trim().length > 0 && summary.length <= 1000;

  const handleSave = async () => {
    if (!amountValid || !summaryValid) {
      setMessage({ tone: 'error', text: 'Enter a whole-naira amount and describe what the price covers.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await saveQuotation({ orderId, amount: parsedAmount, summary });
      const all = await fetchQuotations();
      applyQuotation(all.find((item) => item.order_id === orderId) ?? null);
      setMessage({ tone: 'ok', text: 'Quotation sent to the customer.' });
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Quotation could not be saved.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-navy-700">Loading quotation...</p>;

  if (loadError) {
    return (
      <p role="alert" className="text-sm font-semibold text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {quotation && (
        <div className="flex flex-col gap-2 rounded-2xl bg-mist p-4 text-sm text-navy-800">
          <p>
            <span className="font-semibold text-navy-600">Current status: </span>
            {quotation.status}
          </p>
          <p>
            <span className="font-semibold text-navy-600">Customer response: </span>
            {quotation.status === 'Clarification requested'
              ? quotation.customer_message
              : quotation.status === 'Sent'
                ? 'Waiting for the customer.'
                : quotation.status}
          </p>
        </div>
      )}

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

      <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
        Quoted amount (whole naira)
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          placeholder="e.g. 15000"
          className={FIELD_CLASS}
        />
        {amount !== '' && !amountValid && (
          <span className="text-xs font-semibold text-red-600">Enter a whole-naira amount.</span>
        )}
        {amountValid && <span className="text-xs font-normal text-navy-600">{formatNaira(parsedAmount)}</span>}
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
        What the price covers
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="e.g. 2kg rice, 1 carton of milk, delivery to Hostel 3"
          className={FIELD_CLASS}
        />
      </label>

      <p className="text-xs text-navy-600">Saving sends the quotation back to the customer for a new response.</p>

      <div>
        <Button onClick={handleSave} disabled={busy} className="px-5 py-2.5 text-sm">
          <Send className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Sending...' : quotation ? 'Revise and resend' : 'Send quotation'}
        </Button>
      </div>
    </div>
  );
}
