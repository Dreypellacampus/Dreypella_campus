import type { ReactNode } from 'react';
import FormField from '@/components/order/FormField';
import type { FieldErrors } from '@/lib/validation';
import type { ServiceField } from '@/data/services';

interface FieldsStepProps {
  intro: string;
  fields: ServiceField[];
  values: Record<string, string>;
  errors: FieldErrors;
  onChange: (name: string, value: string) => void;
  children?: ReactNode;
}

export default function FieldsStep({ intro, fields, values, errors, onChange, children }: FieldsStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-2xl bg-mist p-4 text-sm leading-relaxed text-navy-800">{intro}</p>
      {children}
      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name] ?? ''}
          error={errors[field.name]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
