import { normalizePhone } from '@/lib/phone';

export interface CustomerProfile {
  id?: string;
  full_name: string;
  whatsapp: string;
  preferred_address: string | null;
  area: string | null;
  institution: string | null;
  institution_id: string | null;
  department: string | null;
  student_status: string | null;
  customer_category: string | null;
  level_of_study: string | null;
  institution_submission: string | null;
}

function optionalText(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

export function toLocalWhatsapp(value: string): string {
  return normalizePhone(value).replace(/^\+?234/, '0');
}

export function profileToValues(profile: CustomerProfile | null): Record<string, string> {
  return {
    fullName: profile?.full_name ?? '',
    whatsapp: profile?.whatsapp ?? '',
    preferredAddress: profile?.preferred_address ?? '',
    area: profile?.area ?? '',
    institution: profile?.institution ?? '',
    institutionId: profile?.institution_id ?? '',
    department: profile?.department ?? '',
    studentStatus: profile?.student_status ?? '',
    customerCategory: profile?.customer_category ?? '',
    levelOfStudy: profile?.level_of_study ?? '',
    institutionSubmission: profile?.institution_submission ?? '',
  };
}

export function valuesToProfile(values: Record<string, string>): CustomerProfile {
  return {
    full_name: values.fullName.trim(),
    whatsapp: toLocalWhatsapp(values.whatsapp),
    preferred_address: optionalText(values.preferredAddress),
    area: optionalText(values.area),
    institution: optionalText(values.institution),
    institution_id: optionalText(values.institutionId),
    department: optionalText(values.department),
    student_status: optionalText(values.studentStatus),
    customer_category: optionalText(values.customerCategory),
    level_of_study: optionalText(values.levelOfStudy),
    institution_submission: optionalText(values.institutionSubmission),
  };
}
