import { useId, type ChangeEvent, type ReactNode } from 'react';
import type { ServiceField } from '@/data/services';
import { todayIsoDate } from '@/lib/format';

interface FormFieldProps {
  field: ServiceField;
  value: string;
  error?: string;
  onChange: (name: string, value: string) => void;
}

const INPUT_TYPES: Partial<Record<ServiceField['type'], string>> = {
  tel: 'tel',
  number: 'number',
  date: 'date',
  email: 'email',
  password: 'password',
};

const CONTROL_BASE =
  'w-full rounded-2xl border bg-white px-4 py-3 text-base text-navy-900 placeholder:text-navy-400 transition duration-200 focus:outline-none focus:ring-4';

export default function FormField({ field, value, error, onChange }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const stateClass = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
    : 'border-navy-200 focus:border-navy-500 focus:ring-navy-100';
  const controlClass = `${CONTROL_BASE} ${stateClass}`;

  const describedBy = [field.helper ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange(field.name, event.target.value);

  let control: ReactNode;

  if (field.type === 'textarea') {
    control = (
      <textarea
        id={id}
        name={field.name}
        rows={4}
        value={value}
        placeholder={field.placeholder}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
        className={`${controlClass} resize-y`}
      />
    );
  } else if (field.type === 'select') {
    control = (
      <select
        id={id}
        name={field.name}
        value={value}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
        className={controlClass}
      >
        <option value="">Select an option</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'file') {
    control = (
      <div className="flex flex-col gap-3">
        <input
          id={id}
          name={field.name}
          type="file"
          accept={field.accept}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(field.name, event.target.files?.[0]?.name ?? '')}
          className="block w-full cursor-pointer text-sm text-navy-700 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-navy-900 file:px-5 file:py-2.5 file:font-bold file:text-white hover:file:bg-navy-700"
        />
        {value && (
          <p className="rounded-xl bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-900">
            Selected: {value}
          </p>
        )}
      </div>
    );
  } else {
    control = (
      <input
        id={id}
        name={field.name}
        type={INPUT_TYPES[field.type] ?? 'text'}
        inputMode={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'numeric' : undefined}
        min={field.type === 'number' ? 1 : field.type === 'date' ? todayIsoDate() : undefined}
        autoComplete={field.autoComplete ?? (field.type === 'tel' ? 'tel' : undefined)}
        value={value}
        placeholder={field.placeholder}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
        className={controlClass}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-navy-900">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {control}
      {field.helper && (
        <p id={helperId} className="text-sm leading-relaxed text-navy-600">
          {field.helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
