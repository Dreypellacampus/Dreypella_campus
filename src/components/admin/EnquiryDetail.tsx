import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, MessageCircle, RotateCcw, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { formatOrderDateTime } from '@/lib/individualOrderDisplay';
import {
  fetchEnquiryReplies,
  replyToEnquiry,
  setEnquiryArchived,
  setEnquiryStatus,
  type EnquiryReply,
  type EnquiryRow,
} from '@/lib/enquiryRepository';
import { toInternationalNumber } from '@/lib/phone';

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

interface EnquiryDetailProps {
  enquiry: EnquiryRow;
  onClose: () => void;
  onChanged: () => void;
}

export default function EnquiryDetail({ enquiry, onClose, onChanged }: EnquiryDetailProps) {
  const [current, setCurrent] = useState(enquiry);
  const [replies, setReplies] = useState<EnquiryReply[] | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [replyKey, setReplyKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchEnquiryReplies(current.id)
      .then((items) => {
        if (active) setReplies(items);
      })
      .catch(() => {
        if (active) setMessage({ tone: 'error', text: 'Earlier replies could not be loaded.' });
      });
    return () => {
      active = false;
    };
  }, [current.id, replyKey]);

  const run = async (action: () => Promise<void>, success: string, onSuccess: () => void) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      onSuccess();
      setMessage({ tone: 'ok', text: success });
      onChanged();
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handleReply = () => {
    const body = replyText.trim();
    if (body.length === 0) {
      setMessage({ tone: 'error', text: 'Type a reply before saving.' });
      return;
    }
    run(
      () => replyToEnquiry(current.id, body),
      'Reply saved and enquiry marked as answered.',
      () => {
        setCurrent((item) => ({ ...item, status: 'answered' }));
        setReplyText('');
        setReplyKey((key) => key + 1);
      },
    );
  };

  const handleReopen = () =>
    run(
      () => setEnquiryStatus(current.id, 'unanswered'),
      'Enquiry reopened.',
      () => setCurrent((item) => ({ ...item, status: 'unanswered' })),
    );

  const handleArchiveToggle = () => {
    const archive = current.archived_at === null;
    run(
      () => setEnquiryArchived(current.id, archive),
      archive ? 'Enquiry archived.' : 'Enquiry restored.',
      () => setCurrent((item) => ({ ...item, archived_at: archive ? new Date().toISOString() : null })),
    );
  };

  const whatsAppText = `Hello ${current.customer_name}, this is Dreypella Campus replying to your message about ${current.category}.`;
  const whatsAppUrl = `https://wa.me/${toInternationalNumber(current.phone)}?text=${encodeURIComponent(whatsAppText)}`;
  const isArchived = current.archived_at !== null;

  return (
    <Dialog eyebrow={current.category} title={current.customer_name} onClose={onClose}>
      <div className="flex flex-col gap-6">
        {message && (
          <p
            role={message.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-2xl p-4 text-sm font-semibold ${
              message.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {message.text}
          </p>
        )}

        <section className="flex flex-col gap-3 text-sm text-navy-900">
          <p>
            <span className="font-semibold text-navy-600">Phone: </span>
            {current.phone}
          </p>
          {current.email && (
            <p>
              <span className="font-semibold text-navy-600">Email: </span>
              {current.email}
            </p>
          )}
          {current.order_reference && (
            <p>
              <span className="font-semibold text-navy-600">Order reference: </span>
              {current.order_reference}
            </p>
          )}
          <p>
            <span className="font-semibold text-navy-600">Received: </span>
            {formatOrderDateTime(current.created_at)}
          </p>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Reply on WhatsApp
          </a>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Message</h3>
          <p className="whitespace-pre-wrap rounded-2xl bg-navy-50 p-4 text-sm leading-relaxed text-navy-900">
            {current.message}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Saved replies</h3>
          {replies === null && <p className="text-sm text-navy-600">Loading replies...</p>}
          {replies !== null && replies.length === 0 && <p className="text-sm text-navy-600">No replies saved yet.</p>}
          {replies?.map((reply) => (
            <div key={reply.id} className="rounded-2xl border border-navy-100 p-4">
              <p className="text-xs font-semibold text-navy-500">{formatOrderDateTime(reply.created_at)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy-900">{reply.body}</p>
            </div>
          ))}
        </section>

        {!isArchived && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Record a reply</h3>
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              maxLength={2000}
              rows={4}
              aria-label="Reply to customer"
              className={FIELD_CLASS}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleReply} disabled={busy} className="px-5 py-2.5 text-sm">
                <Send className="h-4 w-4" aria-hidden="true" />
                Save reply and mark answered
              </Button>
              {current.status === 'answered' && (
                <Button variant="outline" onClick={handleReopen} disabled={busy} className="px-5 py-2.5 text-sm">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reopen
                </Button>
              )}
            </div>
          </section>
        )}

        <div>
          <Button variant="outline" onClick={handleArchiveToggle} disabled={busy} className="px-5 py-2.5 text-sm">
            {isArchived ? <ArchiveRestore className="h-4 w-4" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
            {isArchived ? 'Restore to inbox' : 'Archive'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
