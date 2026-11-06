import { SERVICES } from '@/data/services';
import type { IndividualOrderRow } from '@/lib/individualOrderRepository';

function fieldLabel(serviceId: string, name: string): string | null {
  const serviceFields = SERVICES[serviceId as keyof typeof SERVICES]?.fields ?? [];
  return serviceFields.find((field) => field.name === name)?.label ?? null;
}

export function orderDetailLines(order: IndividualOrderRow): string[] {
  return Object.entries(order.details).flatMap(([name, value]) => {
    const label = fieldLabel(order.service_id, name);
    if (!label || !value.trim()) return [];
    return [`${label}: ${value}`];
  });
}

export function formatOrderDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatOrderDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
