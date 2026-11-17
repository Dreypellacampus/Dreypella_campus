import type { ServiceField } from '@/data/services';

export const STUDENT_STATUS_OPTIONS = ['Student', 'Not a student'];

export const CUSTOMER_CATEGORY_OPTIONS = [
  'LAUTECH student',
  'Student of another institution',
  'Ogbomoso resident',
  'Worker/professional',
  'Business/other customer',
];

export const EMAIL_FIELD: ServiceField = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  required: true,
  placeholder: 'you@example.com',
  autoComplete: 'email',
};

export const SIGN_IN_PASSWORD_FIELD: ServiceField = {
  name: 'password',
  label: 'Password',
  type: 'password',
  required: true,
  autoComplete: 'current-password',
};

export const PASSWORD_FIELD: ServiceField = {
  name: 'password',
  label: 'Password',
  type: 'password',
  required: true,
  minLength: 8,
  helper: 'Use at least 8 characters.',
  autoComplete: 'new-password',
};

export const CUSTOMER_CATEGORY_FIELD: ServiceField = {
  name: 'customerCategory',
  label: 'Customer type',
  type: 'select',
  required: true,
  options: CUSTOMER_CATEGORY_OPTIONS,
  helper: 'Tell us which best describes you so we can tailor your experience.',
};

export const LEVEL_OF_STUDY_FIELD: ServiceField = {
  name: 'levelOfStudy',
  label: 'Level or year of study (optional)',
  type: 'text',
  placeholder: 'For example 200 level, HND 2',
};

export const INSTITUTION_SUBMISSION_FIELD: ServiceField = {
  name: 'institutionSubmission',
  label: 'Institution not listed? Enter the name for review (optional)',
  type: 'text',
  placeholder: 'We will review and add it if appropriate',
};

export const AREA_FIELD: ServiceField = {
  name: 'area',
  label: 'Area / neighbourhood',
  type: 'text',
  required: true,
  placeholder: 'e.g. Under G, Stadium area, Oke-Ado',
  helper: 'Tell us the area where you usually need deliveries.',
};

export const BASE_PROFILE_FIELDS: ServiceField[] = [
  {
    name: 'fullName',
    label: 'Full name',
    type: 'text',
    required: true,
    placeholder: 'As it appears on your ID',
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    type: 'tel',
    required: true,
    placeholder: '07039172886',
    helper: 'We will reply to you on this number.',
  },
  {
    name: 'preferredAddress',
    label: 'Preferred delivery address (optional)',
    type: 'textarea',
    placeholder: 'Hostel, block and room, or your usual pickup point',
  },
  {
    name: 'department',
    label: 'Department (optional)',
    type: 'text',
  },
];

export const PROFILE_FIELDS: ServiceField[] = [
  ...BASE_PROFILE_FIELDS,
  CUSTOMER_CATEGORY_FIELD,
  LEVEL_OF_STUDY_FIELD,
  INSTITUTION_SUBMISSION_FIELD,
];

export const SIGN_UP_FIELDS: ServiceField[] = [BASE_PROFILE_FIELDS[0], EMAIL_FIELD, PASSWORD_FIELD, ...BASE_PROFILE_FIELDS.slice(1), AREA_FIELD];
