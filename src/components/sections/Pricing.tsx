import { BadgeCheck, CircleDollarSign, Receipt } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import { SERVICE_LIST, type ServiceId } from '@/data/services';

interface PricingProps {
  onOrderService: (service: ServiceId) => void;
}

const PRICING_POINTS = [
  {
    icon: CircleDollarSign,
    title: 'Student-friendly rates',
    description: 'Fair pricing made for student budgets, based on what you actually ask for.',
  },
  {
    icon: Receipt,
    title: 'Quoted before you pay',
    description: 'We reply on WhatsApp with the price for your request, so there are no surprises.',
  },
  {
    icon: BadgeCheck,
    title: 'Pay for what you need',
    description: 'Only pay for the items, pages or errands in your request.',
  },
];

export default function Pricing({ onOrderService }: PricingProps) {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Affordable student pricing"
          title="Pricing that fits a student budget"
          description="Every service is quoted for your exact request. Tell us what you need and we will send you the price on WhatsApp."
        />

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {PRICING_POINTS.map((point) => (
            <li key={point.title} className="rounded-3xl bg-mist p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <point.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy-900">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{point.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 overflow-hidden rounded-3xl border border-navy-100">
          <div className="grid divide-y divide-navy-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {SERVICE_LIST.map((service) => (
              <div key={service.id} className="flex flex-col gap-4 bg-white p-6 transition hover:bg-navy-50/60">
                <div className="flex items-center gap-3">
                  <service.icon className="h-5 w-5 shrink-0 text-navy-900" aria-hidden="true" />
                  <h3 className="text-sm font-extrabold tracking-wide text-navy-900">{service.title}</h3>
                </div>
                <p className="text-2xl font-extrabold text-navy-900">Request a Quote</p>
                <p className="text-sm leading-relaxed text-navy-700">
                  Share your request and get a price tailored to it.
                </p>
                <Button
                  variant="outline"
                  onClick={() => onOrderService(service.id)}
                  className="mt-auto w-full px-4 py-3 text-sm"
                >
                  Request a Quote
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
