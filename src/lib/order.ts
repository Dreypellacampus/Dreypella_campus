import { CONTACT_FIELDS, SERVICES, type ServiceId } from '@/data/services';
import { formatDeliveryLines, type DeliveryLocation } from '@/lib/deliveryLocation';
import { validateFields, type FieldErrors } from '@/lib/validation';
import { normalizePhone } from '@/lib/phone';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export interface OrderDraft {
  reference: string;
  service: ServiceId;
  values: Record<string, string>;
  location: DeliveryLocation;
}

export function validateService(serviceId: ServiceId, values: Record<string, string>): FieldErrors {
  return validateFields(SERVICES[serviceId].fields, values);
}

export function validateContact(values: Record<string, string>): FieldErrors {
  return validateFields(CONTACT_FIELDS, values);
}

export function buildOrderMessage(draft: OrderDraft): string {
  const service = SERVICES[draft.service];
  const answered = (fields: typeof service.fields, values: Record<string, string>) =>
    fields.flatMap((field) => {
      const value = values[field.name]?.trim();
      if (!value) return [];
      const shown = field.type === 'tel' ? normalizePhone(value) : value;
      return [`${field.label}: ${shown}`];
    });

  const lines = [
    '*DREYPELLA CAMPUS ORDER*',
    `*Reference:* ${draft.reference}`,
    `*Service:* ${service.title}`,
    '',
    '*Order details*',
    ...answered(service.fields, draft.values),
    '',
    '*Contact*',
    ...answered(CONTACT_FIELDS, draft.values),
    '',
    '*Delivery location*',
    ...formatDeliveryLines(draft.location),
    '',
    service.messageNote ?? '',
    'Please confirm availability and send me a quote.',
  ];

  return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n');
}

export function buildOrderUrl(draft: OrderDraft): string {
  return buildWhatsAppUrl(buildOrderMessage(draft));
}
