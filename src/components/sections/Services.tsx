import { ArrowRight, CheckCircle2 } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { buttonStyles } from '@/components/ui/Button';
import { SERVICE_LIST, type ServiceId } from '@/data/services';

interface ServicesProps {
  onOrderService: (service: ServiceId) => void;
}

export default function Services({ onOrderService }: ServicesProps) {
  return (
    <section id="services" className="bg-mist py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our services"
          title="Four ways we make campus life easier"
          description="Pick the service you need, tell us the details, and we handle the rest. Every request goes straight to our team on WhatsApp."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {SERVICE_LIST.map((service) => (
            <article
              key={service.id}
              className="group flex flex-col rounded-3xl border border-navy-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-xl hover:shadow-navy-900/10 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white transition duration-300 group-hover:bg-red-500">
                  <service.icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700">
                  Quote on request
                </span>
              </div>

              <h3 className="mt-6 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
                {service.title}
              </h3>
              <p className="mt-2 text-base font-semibold leading-snug text-red-600">
                {service.headline}
              </p>
              <p className="mt-3 text-base leading-relaxed text-navy-700">{service.description}</p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {service.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium text-navy-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onOrderService(service.id)}
                className={buttonStyles('outline', 'mt-8 w-full justify-between sm:w-auto sm:self-start')}
              >
                Order {service.title}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
