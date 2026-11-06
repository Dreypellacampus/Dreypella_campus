import { Building2, Home, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

export type OrderType = 'individual' | 'bulk';

interface OrderTypeStepProps {
  onSelect: (type: OrderType) => void;
}

const OPTIONS: { value: OrderType; title: string; description: string; icon: ReactNode }[] = [
  {
    value: 'individual',
    title: 'Individual Order',
    description: 'Order one service for yourself, such as a single purchase, print job or errand.',
    icon: <Home className="h-5 w-5" aria-hidden="true" />,
  },
  {
    value: 'bulk',
    title: 'Bulk Order',
    description: 'Request several items or print jobs for a department, association, hostel or organization.',
    icon: <Building2 className="h-5 w-5" aria-hidden="true" />,
  },
];

export default function OrderTypeStep({ onSelect }: OrderTypeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-navy-700">Choose the option that fits your request.</p>
      <div role="group" aria-label="Order type" className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="group flex flex-col gap-4 rounded-2xl border-2 border-navy-100 bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:shadow-lg hover:shadow-navy-900/5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white transition group-hover:bg-red-500">
              {option.icon}
            </span>
            <span>
              <span className="block text-base font-extrabold text-navy-900">{option.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-navy-700">{option.description}</span>
            </span>
            <span className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Continue
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
