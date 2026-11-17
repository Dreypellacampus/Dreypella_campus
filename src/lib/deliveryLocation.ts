import type { FieldErrors } from '@/lib/validation';

export type LocationType = 'on-campus' | 'off-campus' | 'other';

export interface DeliveryLocation {
  type: LocationType | '';
  hostel: string;
  block: string;
  room: string;
  area: string;
  locationName: string;
  address: string;
  directions: string;
}

export const EMPTY_DELIVERY_LOCATION: DeliveryLocation = {
  type: '',
  hostel: '',
  block: '',
  room: '',
  area: '',
  locationName: '',
  address: '',
  directions: '',
};

export const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string; description: string }[] = [
  {
    value: 'on-campus',
    label: 'On-campus hostel',
    description: 'A hostel within the institution campus.',
  },
  {
    value: 'off-campus',
    label: 'Off-campus hostel',
    description: 'A hostel or accommodation outside campus.',
  },
  {
    value: 'other',
    label: 'Other location',
    description: 'A faculty office, shop, gate or other agreed delivery point.',
  },
];

const TYPE_LABELS: Record<LocationType, string> = {
  'on-campus': 'On-campus hostel',
  'off-campus': 'Off-campus hostel',
  other: 'Other location',
};

const DETAIL_LABELS: Record<LocationType, Partial<Record<keyof DeliveryLocation, string>>> = {
  'on-campus': { hostel: 'Hostel', block: 'Block', room: 'Room' },
  'off-campus': { hostel: 'Accommodation', area: 'Area or street' },
  other: { locationName: 'Location name', address: 'Address or landmark' },
};

export function validateDeliveryLocation(location: DeliveryLocation): FieldErrors {
  const errors: FieldErrors = {};
  const require = (key: keyof DeliveryLocation, message: string) => {
    if (!location[key].trim()) errors[`location.${key}`] = message;
  };

  if (!location.type) {
    errors['location.type'] = 'Choose where we should deliver';
    return errors;
  }

  if (location.type === 'on-campus') {
    require('hostel', 'Choose or type your hostel');
    require('block', 'Enter your block');
  }

  if (location.type === 'off-campus') {
    require('hostel', 'Enter the hostel or accommodation name');
    require('area', 'Enter the area or street');
  }

  if (location.type === 'other') {
    require('locationName', 'Enter the location name');
    require('address', 'Enter an address or landmark');
  }

  return errors;
}

export function formatDeliveryLines(location: DeliveryLocation): string[] {
  if (!location.type) return [];

  const lines = [`Type: ${TYPE_LABELS[location.type]}`];
  for (const [key, label] of Object.entries(DETAIL_LABELS[location.type])) {
    const value = location[key as keyof DeliveryLocation].trim();
    if (value) lines.push(`${label}: ${value}`);
  }

  const directions = location.directions.trim();
  if (directions) lines.push(`Directions: ${directions}`);

  return lines;
}
