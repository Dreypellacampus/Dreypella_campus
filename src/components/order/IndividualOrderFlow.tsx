import { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import DeliveryLocationFields from '@/components/order/DeliveryLocationFields';
import BuyItemRows from '@/components/order/BuyItemRows';
import ReferenceImageField from '@/components/order/ReferenceImageField';
import FieldsStep from '@/components/order/FieldsStep';
import OrderSent, { type OrderSaveState } from '@/components/order/OrderSent';
import ReviewStep from '@/components/order/ReviewStep';
import ServiceStep from '@/components/order/ServiceStep';
import { CONTACT_FIELDS, SERVICES, type ServiceId } from '@/data/services';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import {
  EMPTY_DELIVERY_LOCATION,
  validateDeliveryLocation,
  type DeliveryLocation,
} from '@/lib/deliveryLocation';
import { EMPTY_BUY_ITEM, serializeBuyItems, type BuyItem } from '@/lib/buyItems';
import { toLocalWhatsapp } from '@/lib/customerProfile';
import { saveIndividualOrder, type IndividualOrderRecord } from '@/lib/individualOrderRepository';
import { uploadReferenceImage, validateReferenceImage } from '@/lib/referenceImage';
import { buildOrderUrl, validateContact, validateService } from '@/lib/order';
import { generateReference } from '@/lib/reference';
import { supabase } from '@/lib/supabase';
import { omitErrors, type FieldErrors } from '@/lib/validation';

type Step = 'service' | 'details' | 'contact' | 'review' | 'sent';

const FLOW: Exclude<Step, 'sent'>[] = ['service', 'details', 'contact', 'review'];

const STEP_LABELS: Record<Exclude<Step, 'sent'>, string> = {
  service: 'Choose a service',
  details: 'Order details',
  contact: 'Contact and delivery',
  review: 'Review and send',
};

interface IndividualOrderFlowProps {
  initialService: ServiceId | null;
  onBack: () => void;
  onClose: () => void;
}

interface SentState {
  url: string;
  saveState: OrderSaveState;
}

export default function IndividualOrderFlow({ initialService, onBack, onClose }: IndividualOrderFlowProps) {
  const session = useCustomerSession();
  const [step, setStep] = useState<Step>(initialService ? 'details' : 'service');
  const [serviceId, setServiceId] = useState<ServiceId | null>(initialService);
  const [values, setValues] = useState<Record<string, string>>({});
  const [buyItems, setBuyItems] = useState<BuyItem[]>([{ ...EMPTY_BUY_ITEM }]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [location, setLocation] = useState<DeliveryLocation>(EMPTY_DELIVERY_LOCATION);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [reference, setReference] = useState(() => generateReference('IND'));
  const [sent, setSent] = useState<SentState | null>(null);

  const stepIndex = step === 'sent' ? FLOW.length : FLOW.indexOf(step);
  const service = serviceId ? SERVICES[serviceId] : null;
  const isSent = step === 'sent';

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => omitErrors(current, (key) => key === name));
  };

  const handleBuyItemsChange = (items: BuyItem[]) => {
    setBuyItems(items);
    handleChange('items', serializeBuyItems(items));
  };

  const handleLocationChange = (next: DeliveryLocation) => {
    setLocation(next);
    setErrors((current) => omitErrors(current, (key) => key.startsWith('location.')));
  };

  const handleSelectService = (id: ServiceId) => {
    setServiceId(id);
    setStep('details');
  };

  const handleNext = () => {
    if (step === 'service' && serviceId) {
      setStep('details');
      return;
    }

    if (step === 'details' && serviceId) {
      const found: FieldErrors = validateService(serviceId, values);
      const imageError = serviceId === 'buy' && referenceImage ? validateReferenceImage(referenceImage) : null;
      if (imageError) found.referenceImage = imageError;
      setErrors(found);
      if (Object.keys(found).length === 0) setStep('contact');
      return;
    }

    if (step === 'contact') {
      const found = { ...validateContact(values), ...validateDeliveryLocation(location) };
      setErrors(found);
      if (Object.keys(found).length === 0) setStep('review');
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 'service') onBack();
    if (step === 'details') setStep('service');
    if (step === 'contact') setStep('details');
    if (step === 'review') setStep('contact');
  };

  const handleSend = async () => {
    if (!serviceId) return;
    const url = buildOrderUrl({ reference, service: serviceId, values, location });
    window.open(url, '_blank', 'noopener,noreferrer');

    if (!supabase) {
      setSent({ url, saveState: 'unavailable' });
      setStep('sent');
      return;
    }

    setSent({ url, saveState: 'saving' });
    setStep('sent');

    const record: IndividualOrderRecord = {
      reference,
      service_id: serviceId,
      service_title: SERVICES[serviceId].title,
      customer_name: values.fullName.trim(),
      whatsapp: toLocalWhatsapp(values.whatsapp),
      details: values,
      delivery_location: location,
    };

    try {
      if (!session.userId) throw new Error('Sign in to save your order.');
      const referenceImagePath =
        serviceId === 'buy' && referenceImage ? await uploadReferenceImage(session.userId, reference, referenceImage) : null;
      await saveIndividualOrder({
        ...record,
        details: referenceImagePath ? { ...values, reference_image: referenceImagePath } : values,
      });
      setSent((current) => current && { ...current, saveState: 'saved' });
    } catch {
      setSent((current) => current && { ...current, saveState: 'failed' });
    }
  };

  const handleStartAgain = () => {
    setValues({});
    setBuyItems([{ ...EMPTY_BUY_ITEM }]);
    setReferenceImage(null);
    setLocation(EMPTY_DELIVERY_LOCATION);
    setErrors({});
    setServiceId(null);
    setSent(null);
    setReference(generateReference('IND'));
    setStep('service');
  };

  return (
    <Dialog
      eyebrow={isSent ? 'Order received' : `Step ${stepIndex + 1} of ${FLOW.length}: ${STEP_LABELS[FLOW[stepIndex]]}`}
      title={service ? service.title : 'Individual order'}
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
              <Button onClick={handleSend} className="px-6 py-3 text-sm">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Send on WhatsApp
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={step === 'service' && !serviceId} className="px-6 py-3 text-sm">
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </>
        )
      }
    >
      {step === 'service' && <ServiceStep selected={serviceId} onSelect={handleSelectService} />}

      {step === 'details' && service && serviceId === 'buy' && (
        <FieldsStep
          intro={service.description}
          fields={service.fields.filter((field) => field.name !== 'items')}
          values={values}
          errors={errors}
          onChange={handleChange}
        >
          <BuyItemRows items={buyItems} error={errors.items} onChange={handleBuyItemsChange} />
          <ReferenceImageField
            file={referenceImage}
            error={errors.referenceImage}
            onChange={(file) => {
              setReferenceImage(file);
              setErrors((current) => omitErrors(current, (key) => key === 'referenceImage'));
            }}
          />
        </FieldsStep>
      )}

      {step === 'details' && service && serviceId !== 'buy' && (
        <FieldsStep
          intro={service.description}
          fields={service.fields}
          values={values}
          errors={errors}
          onChange={handleChange}
        />
      )}

      {step === 'contact' && (
        <div className="flex flex-col gap-6">
          <FieldsStep
            intro="Tell us who we are delivering for and the WhatsApp number we should reply on. Then choose where to deliver."
            fields={CONTACT_FIELDS}
            values={values}
            errors={errors}
            onChange={handleChange}
          />
          <DeliveryLocationFields location={location} errors={errors} onChange={handleLocationChange} />
        </div>
      )}

      {step === 'review' && serviceId && (
        <ReviewStep serviceId={serviceId} values={values} location={location} />
      )}

      {step === 'sent' && sent && (
        <OrderSent
          url={sent.url}
          reference={reference}
          saveState={sent.saveState}
          signedIn={session.status === 'signed-in'}
          onStartAgain={handleStartAgain}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}
