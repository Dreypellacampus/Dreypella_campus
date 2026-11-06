import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Package, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import { STATUS_STYLES } from '@/components/admin/statusStyles';
import { formatDeliveryLines } from '@/lib/deliveryLocation';
import { formatNaira } from '@/lib/format';
import { formatOrderDate } from '@/lib/individualOrderDisplay';
import type { PartnerAssignment } from '@/lib/deliveryPartnerRepository';

const TONE_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-800',
  amber: 'bg-amber-50 text-amber-800',
  navy: 'bg-navy-100 text-navy-900',
} as const;

export function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: keyof typeof TONE_STYLES;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-navy-500">{label}</span>
        <span className="text-xl font-extrabold text-navy-900">{value}</span>
      </div>
    </div>
  );
}

interface AssignmentCardProps {
  assignment: PartnerAssignment;
  updating?: boolean;
  confirming?: boolean;
  onRequestConfirm?: () => void;
  onCancelConfirm?: () => void;
  onConfirm?: () => void;
}

export function AssignmentCard({
  assignment,
  updating = false,
  confirming = false,
  onRequestConfirm,
  onCancelConfirm,
  onConfirm,
}: AssignmentCardProps) {
  const { order } = assignment;
  const isDelivered = assignment.deliveredAt !== null;
  const canMarkDelivered = !isDelivered && order.status === 'Ready for Delivery' && onConfirm !== undefined;

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
            Assigned {formatOrderDate(assignment.assignedAt)}
          </span>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
            <Package className="h-4 w-4 text-red-500" aria-hidden="true" />
            {order.service_title}
          </h3>
          <span className="text-sm font-semibold tracking-wide text-navy-700">{order.reference}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>{order.status}</span>
          <span className="text-base font-extrabold text-navy-900">{formatNaira(assignment.fee)}</span>
        </div>
      </div>

      <div className="grid gap-4 text-sm leading-relaxed text-navy-800 sm:grid-cols-2">
        <div>
          <p className="font-bold text-navy-900">Customer</p>
          <p>{order.customer_name}</p>
          <a
            href={`tel:${order.whatsapp}`}
            className="mt-1 inline-flex items-center gap-2 font-semibold text-navy-900 underline-offset-4 hover:underline"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {order.whatsapp}
          </a>
        </div>
        <div>
          <p className="font-bold text-navy-900">Deliver to</p>
          <ul className="mt-1 flex flex-col gap-1">
            {formatDeliveryLines(order.delivery_location).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {isDelivered && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Delivered {formatOrderDate(assignment.deliveredAt ?? assignment.assignedAt)}
        </p>
      )}

      {!isDelivered && !canMarkDelivered && (
        <p className="text-sm font-semibold text-navy-700">Waiting for the order to be ready for delivery.</p>
      )}

      {canMarkDelivered && !confirming && (
        <Button onClick={onRequestConfirm} className="w-fit px-6 py-3 text-sm">
          Mark as delivered
        </Button>
      )}

      {canMarkDelivered && confirming && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy-50 p-4">
          <p className="text-sm font-semibold text-navy-900">Confirm the customer has received this order?</p>
          <Button onClick={onConfirm} disabled={updating} className="px-5 py-2 text-sm">
            {updating ? 'Saving...' : 'Yes, delivered'}
          </Button>
          <button
            type="button"
            onClick={onCancelConfirm}
            disabled={updating}
            className="text-sm font-bold text-navy-700 hover:underline disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}
