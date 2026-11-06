import type { ServiceField } from '@/data/services';
import { isNigerianMobile } from '@/lib/phone';

export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldError(field: ServiceField, rawValue: string | undefined): string | null {
  const value = rawValue?.trim() ?? '';

  if (!value) return field.required ? `${field.label} is required` : null;

  if (field.type === 'tel' && !isNigerianMobile(value)) {
    return 'Enter a valid Nigerian number, e.g. 07039172886';
  }

  if (field.type === 'email' && !EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address';
  }

  if (field.minLength && value.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters`;
  }

  if (field.type === 'number' && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
    return 'Enter a whole number, 1 or more';
  }

  return null;
}

export function omitErrors(errors: FieldErrors, shouldOmit: (key: string) => boolean): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !shouldOmit(key)));
}

export function validateFields(fields: ServiceField[], values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of fields) {
    const error = fieldError(field, values[field.name]);
    if (error) errors[field.name] = error;
  }

  return errors;
}
