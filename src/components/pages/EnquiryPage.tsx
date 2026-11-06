import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import Button from '@/components/ui/Button';
import {
  ENQUIRY_CATEGORIES,
  submitEnquiry,
  validateEnquiry,
  type EnquiryDraft,
  type EnquiryErrors,
} from '@/lib/enquiryRepository';

const EMPTY_DRAFT: EnquiryDraft = {
  customerName: '',
  phone: '',
  email: '',
  category: '',
  orderReference: '',
  message: '',
};

const INPUT =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

function Field({ label, error, optional, children }: { label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
      <span>
        {label}
        {optional && <span className="font-normal text-navy-500"> (optional)</span>}
      </span>
      {children}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export default function EnquiryPage() {
  const [draft, setDraft] = useState<EnquiryDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: keyof EnquiryDraft) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const found = validateEnquiry(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await submitEnquiry(draft);
      setSent(true);
      setDraft(EMPTY_DRAFT);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'Your message could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <PageShell>
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900">Message received</h1>
          <p className="text-sm leading-relaxed text-navy-700">
            Thank you. The Dreypella Campus team will reply to the phone number you gave. For urgent questions you can also
            message us on WhatsApp.
          </p>
          <Button variant="outline" onClick={() => setSent(false)} className="px-5 py-2.5 text-sm">
            Send another message
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageIntro eyebrow="Send a message" title="Ask us anything">
          <p>Tell us what you need and the team will get back to you on your phone number.</p>
        </PageIntro>

        <form onSubmit={handleSubmit} noValidate className="grid gap-5 rounded-3xl border border-navy-100 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
          <Field label="Full name" error={errors.customerName}>
            <input type="text" value={draft.customerName} onChange={update('customerName')} className={INPUT} />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <input type="tel" value={draft.phone} onChange={update('phone')} placeholder="08012345678" className={INPUT} />
          </Field>
          <Field label="Email" optional error={errors.email}>
            <input type="email" value={draft.email} onChange={update('email')} className={INPUT} />
          </Field>
          <Field label="What is this about?" error={errors.category}>
            <select value={draft.category} onChange={update('category')} className={INPUT}>
              <option value="">Choose a topic</option>
              {ENQUIRY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Order reference" optional error={errors.orderReference}>
              <input
                type="text"
                value={draft.orderReference}
                onChange={update('orderReference')}
                placeholder="DPC-IND-XXXX-XXXXXX"
                className={INPUT}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Your message" error={errors.message}>
              <textarea rows={5} value={draft.message} onChange={update('message')} className={INPUT} />
            </Field>
          </div>

          {submitError && (
            <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 sm:col-span-2">
              {submitError}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="px-6 py-3 text-sm">
              <Send className="h-4 w-4" aria-hidden="true" />
              {busy ? 'Sending...' : 'Send message'}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
