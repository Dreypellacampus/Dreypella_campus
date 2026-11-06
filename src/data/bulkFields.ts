import { SERVICE_LIST, type ServiceField } from '@/data/services';

export const BULK_SERVICE_TYPES = [...SERVICE_LIST.map((service) => service.title), 'Multiple services'];

export const BULK_DETAILS_FIELDS: ServiceField[] = [
  {
    name: 'customerName',
    label: 'Customer or organization name',
    type: 'text',
    required: true,
    placeholder: 'e.g. Computer Science Students Association',
  },
  {
    name: 'contactName',
    label: "Contact person's name",
    type: 'text',
    required: true,
    placeholder: 'Full name of the person we should speak to',
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    type: 'tel',
    required: true,
    placeholder: '07039172886',
    helper: 'We will send your quote and updates to this number.',
  },
  {
    name: 'organization',
    label: 'Department, association, hostel or organization (optional)',
    type: 'text',
    placeholder: 'e.g. Department of Accounting',
  },
  {
    name: 'serviceType',
    label: 'Type of service required',
    type: 'select',
    required: true,
    options: BULK_SERVICE_TYPES,
  },
];

export const BULK_ITEM_FIELDS: ServiceField[] = [
  {
    name: 'name',
    label: 'Item or task',
    type: 'text',
    required: true,
    placeholder: 'e.g. A4 paper, Bic pens, Printing of exam scripts',
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    required: true,
    placeholder: '1',
  },
  {
    name: 'specs',
    label: 'Printing specifications (if applicable)',
    type: 'textarea',
    placeholder: 'e.g. A4, colour, double-sided, spiral binding',
  },
];

export const BULK_DELIVERY_FIELDS: ServiceField[] = [
  {
    name: 'deliveryDate',
    label: 'Required delivery date',
    type: 'date',
    required: true,
  },
  {
    name: 'deliveryTime',
    label: 'Required delivery time',
    type: 'text',
    required: true,
    placeholder: 'e.g. 2:00 PM, or Friday morning',
  },
  {
    name: 'budget',
    label: 'Estimated budget (optional)',
    type: 'text',
    placeholder: 'e.g. N25,000',
  },
  {
    name: 'instructions',
    label: 'Additional instructions (optional)',
    type: 'textarea',
    placeholder: 'Packaging, contact on arrival, sorting by item, etc.',
  },
];
