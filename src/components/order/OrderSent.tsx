import { CheckCircle2, MessageCircle } from 'lucide-react';
import Button, { buttonStyles } from '@/components/ui/Button';

export type OrderSaveState = 'saving' | 'saved' | 'failed' | 'unavailable';

const SAVE_MESSAGES: Record<OrderSaveState, { signedIn: string; guest: string }> = {
  saving: {
    signedIn: 'Recording your order on your account...',
    guest: 'Recording your order with our team...',
  },
  saved: {
    signedIn: 'Your order is saved to your account, so you can follow it under My orders.',
    guest: 'Your order has been recorded with our team. Guest orders do not appear in an order history, so keep your reference number.',
  },
  failed: {
    signedIn: 'We could not record this order on your account. Please make sure the WhatsApp message was sent, and keep your reference number.',
    guest: 'We could not record this order online. Please make sure the WhatsApp message was sent, and keep your reference number.',
  },
  unavailable: {
    signedIn: 'Please make sure the WhatsApp message was sent, and keep your reference number.',
    guest: 'Please make sure the WhatsApp message was sent, and keep your reference number.',
  },
};

interface OrderSentProps {
  url: string;
  reference: string;
  saveState: OrderSaveState;
  signedIn: boolean;
  onStartAgain: () => void;
  onClose: () => void;
}

export default function OrderSent({ url, reference, saveState, signedIn, onStartAgain, onClose }: OrderSentProps) {
  const message = SAVE_MESSAGES[saveState][signedIn ? 'signedIn' : 'guest'];

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-xl font-extrabold text-navy-900">Your order is ready on WhatsApp</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-700 sm:text-base">
          WhatsApp should have opened with your order details filled in. Tap send in the chat to complete your
          order. If it did not open, use the button below.
        </p>
      </div>

      <div className="rounded-2xl bg-mist px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-navy-600">Your reference</p>
        <p className="mt-1 text-lg font-extrabold tracking-wide text-navy-900">{reference}</p>
      </div>

      <p role="status" className="max-w-md text-sm leading-relaxed text-navy-700">
        {message}
      </p>

      <a href={url} target="_blank" rel="noopener noreferrer" className={buttonStyles('primary', 'w-full sm:w-auto')}>
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Open WhatsApp
      </a>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button variant="outline" onClick={onStartAgain} className="w-full sm:w-auto">
          Place another order
        </Button>
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>
      </div>
    </div>
  );
}
