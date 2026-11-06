import type { BulkStatus } from '@/lib/bulkOrder';

export const STATUS_STYLES: Record<BulkStatus, string> = {
  Pending: 'bg-navy-100 text-navy-800',
  Quoted: 'bg-blue-50 text-blue-800',
  Accepted: 'bg-emerald-50 text-emerald-800',
  Processing: 'bg-amber-50 text-amber-800',
  'Ready for Delivery': 'bg-sky-50 text-sky-800',
  Delivered: 'bg-emerald-100 text-emerald-900',
  Cancelled: 'bg-red-50 text-red-700',
};
