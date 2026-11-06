import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import Button, { buttonStyles } from '@/components/ui/Button';

export type BulkSaveState = 'saving' | 'saved' | 'failed' | 'unavailable';

interface BulkSentStepProps {
  reference: string;
  whatsappUrl: string;
  saveState: BulkSaveState;
  onClose: () => void;
}

const SAVE_MESSAGES: Record<BulkSaveState, string> = {
  saving: 'Recording your request with our team...',
  saved: 'Your request has been recorded with our team. Keep your reference number for follow-up.',
  failed:
    'We could not record this request online. Please make sure the WhatsApp message was sent, and keep your reference number.',
  unavailable:
    'Online recording is not connected for this website yet, so this request exists only on WhatsApp. Please make sure the message was sent.',
};

export default function BulkSentStep({ reference, whatsappUrl, saveState, onClose }: BulkSentStepProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>

      <p className="mx-auto max-w-md text-base leading-relaxed text-navy-800">
        Thank you for choosing Dreypella Campus! Your bulk-order request has been prepared successfully. Our team
        will review your requirements and contact you shortly with availability, pricing and delivery arrangements.
      </p>

      <div className="flex flex-col gap-1 rounded-2xl bg-navy-900 px-6 py-4 text-white">
        <span className="text-xs font-bold uppercase tracking-wider text-red-300">Reference number</span>
        <span className="text-lg font-extrabold tracking-wide">{reference}</span>
      </div>

      <p
        role="status"
        className="flex max-w-md items-center justify-center gap-2 text-sm leading-relaxed text-navy-700"
      >
        {saveState === 'saving' && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
        <span>{SAVE_MESSAGES[saveState]}</span>
      </p>

      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles('primary', 'w-full sm:w-auto')}>
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Open WhatsApp
      </a>
      <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
        Close
      </Button>
    </div>
  );
}
