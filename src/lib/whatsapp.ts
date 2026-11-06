import { toInternationalNumber } from '@/lib/phone';

export const WHATSAPP_DISPLAY_NUMBER = '07039172886';

const WHATSAPP_INTERNATIONAL_NUMBER = '2347039172886';

export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_INTERNATIONAL_NUMBER}`;

export function buildWhatsAppUrl(message: string): string {
  return `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(message)}`;
}

export function buildCustomerChatUrl(whatsapp: string, message: string): string {
  return `https://wa.me/${toInternationalNumber(whatsapp)}?text=${encodeURIComponent(message)}`;
}
