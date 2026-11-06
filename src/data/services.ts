import {
  Package,
  Printer,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export type ServiceId = 'buy' | 'print' | 'get' | 'deliver';

export interface ServiceField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'file' | 'number' | 'tel' | 'date' | 'email' | 'password';
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: string[];
  accept?: string;
  autoComplete?: string;
  minLength?: number;
}

export interface ServiceDefinition {
  id: ServiceId;
  title: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
  fields: ServiceField[];
  messageNote?: string;
}

export const SERVICES: Record<ServiceId, ServiceDefinition> = {
  buy: {
    id: 'buy',
    title: 'BUY FOR ME',
    headline: 'Your essentials, bought and brought to you.',
    description:
      'Groceries, provisions, snacks, drinks, toiletries, stationery and other student must-haves. Tell us what you need and we shop for you.',
    icon: ShoppingBag,
    highlights: [
      'Groceries and provisions',
      'Snacks and drinks',
      'Toiletries and stationery',
      'Hostel essentials',
    ],
    fields: [
      {
        name: 'items',
        label: 'Items you need',
        type: 'textarea',
        required: true,
        placeholder: 'e.g. 2kg rice, 1 carton of milk, 3 bottles of water, toothpaste',
        helper: 'List everything you want. Add brand or size if you have a preference.',
      },
      {
        name: 'budget',
        label: 'Estimated budget (optional)',
        type: 'text',
        placeholder: 'e.g. N5,000',
      },
      {
        name: 'shopNotes',
        label: 'Shop or extra notes (optional)',
        type: 'textarea',
        placeholder: 'Any shop you prefer, or anything else we should know',
      },
      {
        name: 'substitution',
        label: 'If an item is unavailable',
        type: 'select',
        required: true,
        options: ['Ask me on WhatsApp first', 'Accept a close alternative', 'Do not substitute'],
      },
      {
        name: 'preferredTime',
        label: 'Preferred delivery date and time',
        type: 'text',
        required: true,
        placeholder: 'e.g. Tomorrow, 4pm to 6pm',
      },
    ],
  },
  print: {
    id: 'print',
    title: 'PRINT FOR ME',
    headline: 'Print, copy and scan without the queue.',
    description:
      'Upload your document, choose how you want it printed, and have it ready for pickup or delivered to your hostel.',
    icon: Printer,
    highlights: [
      'Document printing',
      'Photocopying and scanning',
      'Binding on request',
      'Document delivery',
    ],
    fields: [
      {
        name: 'document',
        label: 'Document file',
        type: 'file',
        required: true,
        accept: '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png',
        helper:
          'Select your file so we know its name. After submitting, send the actual file in the WhatsApp chat.',
      },
      {
        name: 'serviceType',
        label: 'What do you need?',
        type: 'select',
        required: true,
        options: ['Printing', 'Photocopying', 'Scanning', 'Document delivery'],
      },
      {
        name: 'pages',
        label: 'Pages to print',
        type: 'text',
        required: true,
        placeholder: 'e.g. All pages, or 1-5, 8, 12',
      },
      {
        name: 'copies',
        label: 'Number of copies',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'colour',
        label: 'Colour',
        type: 'select',
        required: true,
        options: ['Black and white', 'Colour'],
      },
      {
        name: 'sides',
        label: 'Sides',
        type: 'select',
        required: true,
        options: ['Single-sided', 'Double-sided'],
      },
      {
        name: 'paperSize',
        label: 'Paper size',
        type: 'select',
        required: true,
        options: ['A4', 'A3', 'Other (write in notes)'],
      },
      {
        name: 'binding',
        label: 'Binding',
        type: 'select',
        options: ['None', 'Staple', 'Spiral binding', 'Hard binding'],
      },
      {
        name: 'deliveryMethod',
        label: 'How will you receive it?',
        type: 'select',
        required: true,
        options: ['Pickup', 'Delivery to my hostel'],
      },
      {
        name: 'printNotes',
        label: 'Extra printing notes (optional)',
        type: 'textarea',
        placeholder: 'Margins, landscape layout, urgent deadline, etc.',
      },
    ],
    messageNote: 'I will send the document file in this WhatsApp chat.',
  },
  get: {
    id: 'get',
    title: 'GET IT FOR ME',
    headline: 'Shop pickups, parcels and small errands, handled.',
    description:
      'Need something collected or an errand run? Tell us where to go and what to get, and we take care of the trip.',
    icon: Package,
    highlights: [
      'Shop pickups',
      'Parcel collection',
      'Document collection',
      'Small errands',
    ],
    fields: [
      {
        name: 'errandType',
        label: 'Type of errand',
        type: 'select',
        required: true,
        options: ['Shop pickup', 'Parcel collection', 'Document collection', 'Small errand'],
      },
      {
        name: 'pickupLocation',
        label: 'Where should we go?',
        type: 'text',
        required: true,
        placeholder: 'e.g. Post office, shop name, faculty office, gate',
      },
      {
        name: 'errandDetails',
        label: 'What should we collect or do?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the item, the errand, or any reference number',
      },
      {
        name: 'collectionContact',
        label: 'Collection contact (optional)',
        type: 'text',
        placeholder: 'Name and phone of anyone collecting on your behalf',
      },
      {
        name: 'collectionCode',
        label: 'Collection code or reference (optional)',
        type: 'text',
        placeholder: 'Tracking number, pickup code or receipt reference',
      },
      {
        name: 'destination',
        label: 'Where should it be taken?',
        type: 'text',
        required: true,
        placeholder: 'e.g. Hostel 3, room 12, or your faculty office',
      },
      {
        name: 'preferredTime',
        label: 'Preferred date and time',
        type: 'text',
        required: true,
        placeholder: 'e.g. Tomorrow, 4pm to 6pm',
      },
    ],
  },
  deliver: {
    id: 'deliver',
    title: 'DELIVER TO ME',
    headline: 'Your items, delivered to your hostel or spot.',
    description:
      'Already bought something or have a package waiting? We bring purchased items, documents and parcels straight to your hostel or an approved location.',
    icon: Truck,
    highlights: [
      'Purchased items',
      'Documents and parcels',
      'Hostel doorstep delivery',
      'Approved campus locations',
    ],
    fields: [
      {
        name: 'itemDescription',
        label: 'What needs delivering?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the items, documents or parcel',
      },
      {
        name: 'pickupFrom',
        label: 'Pick up from',
        type: 'text',
        required: true,
        placeholder: 'Shop, office or where the item is now',
      },
      {
        name: 'senderDetails',
        label: 'Sender name and phone',
        type: 'text',
        required: true,
        placeholder: 'Who is sending the item',
      },
      {
        name: 'receiverDetails',
        label: 'Receiver name and phone',
        type: 'text',
        required: true,
        placeholder: 'Who should receive it',
      },
      {
        name: 'deliveryTime',
        label: 'Preferred delivery time',
        type: 'select',
        required: true,
        options: [
          'As soon as possible',
          'Today, afternoon',
          'Today, evening',
          'Arrange on WhatsApp',
        ],
      },
      {
        name: 'deliveryInstructions',
        label: 'Delivery instructions (optional)',
        type: 'textarea',
        placeholder: 'Gate, landmark, or anything the rider should know',
      },
    ],
  },
};

export const SERVICE_LIST = Object.values(SERVICES);

export const CONTACT_FIELDS: ServiceField[] = [
  {
    name: 'fullName',
    label: 'Full name',
    type: 'text',
    required: true,
    placeholder: 'As it appears on your student ID',
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    type: 'tel',
    required: true,
    placeholder: '07039172886',
    helper: 'We will reply to you on this number.',
  },
];
