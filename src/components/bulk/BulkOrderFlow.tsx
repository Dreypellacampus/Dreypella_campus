import { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import BulkItemsStep from '@/components/bulk/BulkItemsStep';
import BulkReviewStep from '@/components/bulk/BulkReviewStep';
import BulkSentStep, { type BulkSaveState } from '@/components/bulk/BulkSentStep';
import DeliveryLocationFields from '@/components/order/DeliveryLocationFields';
import FieldsStep from '@/components/order/FieldsStep';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { BULK_DELIVERY_FIELDS, BULK_DETAILS_FIELDS } from '@/data/bulkFields';
import { usePriceCatalog } from '@/hooks/usePriceCatalog';
import {
  buildBulkOrderMessage,
  buildBulkPayload,
  createItemDraft,
  generateBulkReference,
  validateBulkDelivery,
  validateBulkItems,
  type BulkItemDraft,
} from '@/lib/bulkOrder';
import { saveBulkOrder } from '@/lib/bulkOrderRepository';
import { EMPTY_DELIVERY_LOCATION, type DeliveryLocation } from '@/lib/deliveryLocation';
import { supabase } from '@/lib/supabase';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { omitErrors, validateFields, type FieldErrors } from '@/lib/validation';

type BulkStep = 'contact' | 'items' | 'delivery' | 'review' | 'sent';
type FormStep = Exclude<BulkStep, 'sent'>;

const FLOW: FormStep[] = ['contact', 'items', 'delivery', 'review'];

const STEP_LABELS: Record<FormStep, string> = {
  contact: 'Your details',
  items: 'Items needed',
  delivery: 'Delivery plan',
  review: 'Review and send',
};

interface SentRequest {
  reference: string;
  whatsappUrl: string;
  saveState: BulkSaveState;
}

interface BulkOrderFlowProps {
  onBack: () => void;
  onClose: () => void;
}

export default function BulkOrderFlow({ onBack, onClose }: BulkOrderFlowProps) {
  const [step, setStep] = useState<BulkStep>('contact');
  const [reference] = useState(generateBulkReference);
  const [values, setValues] = useState<Record<string, string>>({});
  const [items, setItems] = useState<BulkItemDraft[]>(() => [createItemDraft()]);
  const [location, setLocation] = useState<DeliveryLocation>(EMPTY_DELIVERY_LOCATION);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<SentRequest | null>(null);
  const { state: priceState, reload: reloadPrices } = usePriceCatalog();
  const readyPrices = priceState.status === 'ready' ? priceState.prices : null;

  const isSent = step === 'sent';
  const stepIndex = isSent ? FLOW.length : FLOW.indexOf(step);

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => omitErrors(current, (key) => key === name));
  };

  const handleLocationChange = (next: DeliveryLocation) => {
    setLocation(next);
    setErrors((current) => omitErrors(current, (key) => key.startsWith('location.')));
  };

  const handleItemChange = (key: string, name: 'name' | 'quantity' | 'specs', value: string) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [name]: value } : item)));
    setErrors((current) => omitErrors(current, (errorKey) => errorKey === `${key}.${name}`));
  };

  const handleAddItem = () => setItems((current) => [...current, createItemDraft()]);

  const handleRemoveItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
    setErrors((current) => omitErrors(current, (errorKey) => errorKey.startsWith(`${key}.`)));
  };

  const handleNext = () => {
    if (step === 'contact') {
      const found = validateFields(BULK_DETAILS_FIELDS, values);
      setErrors(found);
      if (Object.keys(found).length === 0) setStep('items');
      return;
    }

    if (step === 'items') {
      const found = validateBulkItems(items);
      setErrors(found);
      if (Object.keys(found).length === 0) setStep('delivery');
      return;
    }

    if (step === 'delivery') {
      const found = validateBulkDelivery(values, location);
      setErrors(found);
      if (Object.keys(found).length === 0) setStep('review');
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 'contact') onBack();
    if (step === 'items') setStep('contact');
    if (step === 'delivery') setStep('items');
    if (step === 'review') setStep('delivery');
  };

  const handleSubmit = async () => {
    if (!readyPrices) return;
    const payload = buildBulkPayload(values, items, location);
    const whatsappUrl = buildWhatsAppUrl(buildBulkOrderMessage({ ...payload, reference }, readyPrices));
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (!supabase) {
      setSent({ reference, whatsappUrl, saveState: 'unavailable' });
      setStep('sent');
      return;
    }

    setSent({ reference, whatsappUrl, saveState: 'saving' });
    setStep('sent');

    try {
      await saveBulkOrder(payload, reference);
      setSent((current) => current && { ...current, saveState: 'saved' });
    } catch {
      setSent((current) => current && { ...current, saveState: 'failed' });
    }
  };

  const formStep: FormStep = isSent ? 'review' : step;

  return (
    <Dialog
      eyebrow={isSent ? 'Request received' : `Step ${stepIndex + 1} of ${FLOW.length}: ${STEP_LABELS[formStep]}`}
      title="Bulk order"
      onClose={onClose}
      progress={isSent ? null : { current: stepIndex, total: FLOW.length }}
      footer={
        isSent ? null : (
          <>
            <Button variant="outline" onClick={handleBack} className="px-5 py-3 text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            {step === 'review' ? (
              <Button onClick={handleSubmit} disabled={!readyPrices} className="px-6 py-3 text-sm">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Send on WhatsApp
              </Button>
            ) : (
              <Button onClick={handleNext} className="px-6 py-3 text-sm">
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </>
        )
      }
    >
      {step === 'contact' && (
        <FieldsStep
          intro="Tell us who the order is for and who we should contact about it."
          fields={BULK_DETAILS_FIELDS}
          values={values}
          errors={errors}
          onChange={handleChange}
        />
      )}

      {step === 'items' && (
        <BulkItemsStep
          items={items}
          errors={errors}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
          onChange={handleItemChange}
        />
      )}

      {step === 'delivery' && (
        <div className="flex flex-col gap-6">
          <FieldsStep
            intro="When and where do you need everything delivered?"
            fields={BULK_DELIVERY_FIELDS}
            values={values}
            errors={errors}
            onChange={handleChange}
          />
          <DeliveryLocationFields location={location} errors={errors} onChange={handleLocationChange} />
        </div>
      )}

      {step === 'review' && (
        <BulkReviewStep
          reference={reference}
          payload={buildBulkPayload(values, items, location)}
          prices={readyPrices ?? []}
          pricesStatus={priceState.status}
          onRetryPrices={reloadPrices}
        />
      )}

      {isSent && sent && (
        <BulkSentStep
          reference={sent.reference}
          whatsappUrl={sent.whatsappUrl}
          saveState={sent.saveState}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}
