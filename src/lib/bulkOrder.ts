import { BULK_DELIVERY_FIELDS, BULK_ITEM_FIELDS } from '@/data/bulkFields';
import {
  formatDeliveryLines,
  validateDeliveryLocation,
  type DeliveryLocation,
} from '@/lib/deliveryLocation';
import { formatDisplayDate, formatNaira, todayIsoDate } from '@/lib/format';
import { normalizePhone } from '@/lib/phone';
import { priceLineItems } from '@/lib/pricing';
import { generateReference } from '@/lib/reference';
import type { PriceItem } from '@/lib/priceRepository';
import { validateFields, type FieldErrors } from '@/lib/validation';

export const BULK_STATUSES = [
  'Pending',
  'Quoted',
  'Accepted',
  'Processing',
  'Ready for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type BulkStatus = (typeof BULK_STATUSES)[number];

export const MAX_BULK_ITEMS = 100;

export interface BulkItem {
  name: string;
  quantity: number;
  specs: string;
}

export interface BulkOrderPayload {
  customer_name: string;
  contact_name: string;
  whatsapp: string;
  organization: string | null;
  service_type: string;
  items: BulkItem[];
  delivery_location: DeliveryLocation;
  delivery_date: string;
  delivery_time: string;
  budget: string | null;
  instructions: string | null;
}

export interface BulkOrderRecord extends BulkOrderPayload {
  reference: string;
}

export interface BulkOrderRow extends BulkOrderRecord {
  id: string;
  status: BulkStatus;
  internal_notes: string | null;
  customer_response: string | null;
  created_at: string;
  updated_at: string;
  institution_id?: string | null;
  institution_name_snapshot?: string | null;
}

export interface BulkItemDraft {
  key: string;
  name: string;
  quantity: string;
  specs: string;
}

export function generateBulkReference(): string {
  return generateReference('BLK');
}

export function createItemDraft(): BulkItemDraft {
  return {
    key: Math.random().toString(36).slice(2, 10),
    name: '',
    quantity: '1',
    specs: '',
  };
}

export function validateBulkItems(items: BulkItemDraft[]): FieldErrors {
  const errors: FieldErrors = {};

  if (items.length === 0) errors.items = 'Add at least one item';
  if (items.length > MAX_BULK_ITEMS) {
    errors.items = `A bulk order can include up to ${MAX_BULK_ITEMS} items`;
  }

  for (const item of items) {
    const itemErrors = validateFields(BULK_ITEM_FIELDS, {
      name: item.name,
      quantity: item.quantity,
      specs: item.specs,
    });
    for (const [field, message] of Object.entries(itemErrors)) {
      errors[`${item.key}.${field}`] = message;
    }
  }

  return errors;
}

export function validateBulkDelivery(
  values: Record<string, string>,
  location: DeliveryLocation
): FieldErrors {
  const errors = validateFields(BULK_DELIVERY_FIELDS, values);

  if (values.deliveryDate && values.deliveryDate < todayIsoDate()) {
    errors.deliveryDate = 'Choose today or a later date';
  }

  return { ...errors, ...validateDeliveryLocation(location) };
}

export function buildBulkPayload(
  values: Record<string, string>,
  items: BulkItemDraft[],
  location: DeliveryLocation
): BulkOrderPayload {
  const optional = (value: string | undefined) => value?.trim() || null;

  return {
    customer_name: values.customerName.trim(),
    contact_name: values.contactName.trim(),
    whatsapp: normalizePhone(values.whatsapp),
    organization: optional(values.organization),
    service_type: values.serviceType,
    items: items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
      specs: item.specs.trim(),
    })),
    delivery_location: location,
    delivery_date: values.deliveryDate,
    delivery_time: values.deliveryTime.trim(),
    budget: optional(values.budget),
    instructions: optional(values.instructions),
  };
}

export function buildBulkOrderMessage(order: BulkOrderRecord, prices: ReadonlyArray<PriceItem>): string {
  const pricing = priceLineItems(order.items, prices);
  const priceText = (subtotal: number | null) =>
    subtotal === null ? 'Request a Quote' : formatNaira(subtotal);

  const itemLines = order.items.flatMap((item, index) => [
    `${index + 1}. ${item.name} - Qty: ${item.quantity}`,
    ...(item.specs ? [`   Specifications: ${item.specs}`] : []),
    `   Price: ${priceText(pricing.lines[index].subtotal)}`,
  ]);

  return [
    '*DREYPELLA CAMPUS BULK ORDER*',
    `*Reference:* ${order.reference}`,
    `*Service type:* ${order.service_type}`,
    '',
    `*Requested items (${order.items.length})*`,
    ...itemLines,
    `*Estimated total:* ${priceText(pricing.total)}`,
    '',
    '*Customer details*',
    `Customer / organization: ${order.customer_name}`,
    `Contact person: ${order.contact_name}`,
    `WhatsApp: ${order.whatsapp}`,
    ...(order.organization ? [`Department / association / hostel: ${order.organization}`] : []),
    '',
    '*Delivery*',
    ...formatDeliveryLines(order.delivery_location),
    `Required date: ${formatDisplayDate(order.delivery_date)}`,
    `Required time: ${order.delivery_time}`,
    ...(order.budget ? [`Estimated budget: ${order.budget}`] : []),
    ...(order.instructions ? [`Additional instructions: ${order.instructions}`] : []),
    '',
    'Please confirm availability, pricing and delivery arrangements.',
  ].join('\n');
}

const STATUS_RESPONSE_BODY: Record<BulkStatus, string> = {
  Pending:
    'We have received your request and are reviewing the items. We will send you availability and pricing shortly.',
  Quoted:
    'We have prepared a quote for your request. Please reply to confirm if you would like us to proceed.',
  Accepted:
    'Thank you for accepting our quote. We are preparing your order and will keep you updated.',
  Processing:
    'Your order is being processed. We will let you know as soon as it is ready for delivery.',
  'Ready for Delivery':
    'Your order is ready and will be delivered on the date and time you requested. Please confirm you will be available at the delivery location.',
  Delivered:
    'Your order has been delivered. Thank you for choosing Dreypella Campus. Please let us know if anything is missing.',
  Cancelled:
    'Your request has been cancelled. Please contact us if this was not expected.',
};

export function draftCustomerResponse(order: BulkOrderRow): string {
  return `Hello ${order.contact_name}, this is Dreypella Campus about your bulk request ${order.reference}. ${STATUS_RESPONSE_BODY[order.status]}`;
}
