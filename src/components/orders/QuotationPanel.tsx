import { useState } from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/format';
import { respondToQuotation, type Quotation } from '@/lib/quotationRepository';

interface QuotationPanelProps {
  quotation: Quotation;
  onResponded: () => void;
}

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

const MAX_QUESTION = 1000;

export default function QuotationPanel({ quotation, onResponded }: QuotationPanelProps) {
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respond = async (decision: 'Approved' | 'Declined' | 'Clarification requested', text = '') => {
    setBusy(true);
    setError(null);
    try {
      await respondToQuotation(quotation.order_id, decision, text);
      setAsking(false);
      setQuestion('');
      onResponded();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your response could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  const handleAskSubmit = () => {
    if (!question.trim()) {
      setError('Tell us what you would like clarified.');
      return;
    }
    void respond('Clarification requested', question);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-mist p-4 sm:p-5" aria-label="Quotation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-navy-600">Quotation</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-900">{quotation.status}</span>
      </div>

      <p className="text-2xl font-extrabold text-navy-900">{formatNaira(quotation.amount)}</p>
      {quotation.summary && <p className="text-sm leading-relaxed text-navy-800">{quotation.summary}</p>}

      {quotation.status === 'Sent' && !asking && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => respond('Approved')} disabled={busy} className="px-5 py-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Approve
          </Button>
          <Button variant="outline" onClick={() => setAsking(true)} disabled={busy} className="px-5 py-2.5 text-sm">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Ask a question
          </Button>
          <Button variant="outline" onClick={() => respond('Declined')} disabled={busy} className="px-5 py-2.5 text-sm">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Decline
          </Button>
        </div>
      )}

      {quotation.status === 'Sent' && asking && (
        <div className="flex flex-col gap-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, MAX_QUESTION))}
            rows={3}
            aria-label="Your question"
            placeholder="What would you like us to clarify?"
            className={FIELD_CLASS}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleAskSubmit} disabled={busy} className="px-5 py-2.5 text-sm">
              {busy ? 'Sending...' : 'Send question'}
            </Button>
            <Button variant="outline" onClick={() => setAsking(false)} disabled={busy} className="px-5 py-2.5 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {quotation.status === 'Clarification requested' && (
        <p className="text-sm text-navy-800">
          Your question: <span className="italic">{quotation.customer_message}</span>. We will send an updated quotation shortly.
        </p>
      )}
      {quotation.status === 'Approved' && (
        <p className="text-sm font-semibold text-emerald-800">You approved this quotation.</p>
      )}
      {quotation.status === 'Declined' && <p className="text-sm font-semibold text-navy-800">You declined this quotation.</p>}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
