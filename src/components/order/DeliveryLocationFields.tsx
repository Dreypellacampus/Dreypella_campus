import { Building2, Home, MapPin, type LucideIcon } from 'lucide-react';
import FormField from '@/components/order/FormField';
import HostelCombobox from '@/components/order/HostelCombobox';
import { useHostels } from '@/hooks/useHostels';
import type { ServiceField } from '@/data/services';
import {
  LOCATION_TYPE_OPTIONS,
  type DeliveryLocation,
  type LocationType,
} from '@/lib/deliveryLocation';
import type { FieldErrors } from '@/lib/validation';

interface DeliveryLocationFieldsProps {
  location: DeliveryLocation;
  errors: FieldErrors;
  onChange: (next: DeliveryLocation) => void;
}

const TYPE_ICONS: Record<LocationType, LucideIcon> = {
  'on-campus': Building2,
  'off-campus': Home,
  other: MapPin,
};

const DIRECTIONS_FIELD: ServiceField = {
  name: 'directions',
  label: 'Directions (optional)',
  type: 'textarea',
  placeholder: 'Landmarks, gate to use, or what to look for when you arrive',
};

const FIELDS_BY_TYPE: Record<LocationType, ServiceField[]> = {
  'on-campus': [
    { name: 'block', label: 'Block', type: 'text', required: true, placeholder: 'e.g. Block C' },
    { name: 'room', label: 'Room number (optional)', type: 'text', placeholder: 'e.g. 14' },
  ],
  'off-campus': [
    {
      name: 'hostel',
      label: 'Accommodation name',
      type: 'text',
      required: true,
      placeholder: 'Name of the hostel or flat',
    },
    { name: 'area', label: 'Area or street', type: 'text', required: true, placeholder: 'Area or street name' },
  ],
  other: [
    {
      name: 'locationName',
      label: 'Location name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Faculty office, shop name, campus gate',
    },
    {
      name: 'address',
      label: 'Address or landmark',
      type: 'text',
      required: true,
      placeholder: 'Street, landmark or nearest known place',
    },
  ],
};

export default function DeliveryLocationFields({ location, errors, onChange }: DeliveryLocationFieldsProps) {
  const { hostels, status, reload } = useHostels();
  const campusHostels = hostels.filter((hostel) => hostel.location_type === 'on-campus');

  const update = (key: keyof DeliveryLocation, value: string) => onChange({ ...location, [key]: value });
  const fieldError = (key: keyof DeliveryLocation) => errors[`location.${key}`];

  const fields = location.type ? FIELDS_BY_TYPE[location.type] : [];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-navy-100 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-navy-900">
          Delivery location <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm leading-relaxed text-navy-600">Where should we deliver your order?</p>
      </div>

      <div role="group" aria-label="Delivery location type" className="grid gap-3 sm:grid-cols-3">
        {LOCATION_TYPE_OPTIONS.map((option) => {
          const Icon = TYPE_ICONS[option.value];
          const selected = location.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ ...location, type: option.value })}
              className={`flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition duration-200 ${
                selected
                  ? 'border-red-500 bg-red-50 shadow-md shadow-red-500/10'
                  : 'border-navy-100 bg-white hover:border-navy-300'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  selected ? 'bg-red-500 text-white' : 'bg-navy-900 text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-extrabold text-navy-900">{option.label}</span>
              <span className="text-xs leading-snug text-navy-600">{option.description}</span>
            </button>
          );
        })}
      </div>
      {fieldError('type') && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {fieldError('type')}
        </p>
      )}

      {location.type === 'on-campus' && (
        <HostelCombobox
          id="location-hostel"
          label="Hostel"
          value={location.hostel}
          hostels={campusHostels}
          status={status}
          error={fieldError('hostel')}
          onChange={(value) => update('hostel', value)}
        />
      )}

      {status === 'error' && location.type === 'on-campus' && (
        <button type="button" onClick={reload} className="w-fit text-sm font-bold text-red-600 underline">
          Try loading the hostel list again
        </button>
      )}

      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={location[field.name as keyof DeliveryLocation]}
          error={fieldError(field.name as keyof DeliveryLocation)}
          onChange={(name, value) => update(name as keyof DeliveryLocation, value)}
        />
      ))}

      {location.type && (
        <FormField
          field={DIRECTIONS_FIELD}
          value={location.directions}
          onChange={(name, value) => update(name as keyof DeliveryLocation, value)}
        />
      )}
    </section>
  );
}
