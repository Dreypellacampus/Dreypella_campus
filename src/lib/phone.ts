const NIGERIAN_MOBILE = /^(?:\+?234|0)[789][01]\d{8}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, '');
}

export function isNigerianMobile(value: string): boolean {
  return NIGERIAN_MOBILE.test(normalizePhone(value));
}

export function toInternationalNumber(value: string): string {
  const digits = normalizePhone(value);
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits.replace(/^\+/, '');
}
