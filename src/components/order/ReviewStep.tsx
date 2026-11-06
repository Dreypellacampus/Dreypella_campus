import { SERVICES, CONTACT_FIELDS, type ServiceId, type ServiceField } from '@/data/services';
import { formatDeliveryLines, type DeliveryLocation } from '@/lib/deliveryLocation';

interface ReviewStepProps {
  serviceId: ServiceId;
  values: Record<string, string>;
  location: DeliveryLocation;
}

function ReviewList({ title, fields, values }: { title: string; fields: ServiceField[]; values: Record<string, string> }) {
  const answered = fields.filter((field) => values[field.name]?.trim());

  return (
    <section className="rounded-2xl border border-navy-100 p-5">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">{title}</h3>
      <dl className="mt-4 flex flex-col gap-4">
        {answered.map((field) => (
          <div key={field.name} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="text-sm font-semibold text-navy-600 sm:w-44 sm:shrink-0">{field.label}</dt>
            <dd className="whitespace-pre-line break-words text-sm font-semibold text-navy-900 sm:text-base">
              {values[field.name].trim()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ReviewStep({ serviceId, values, location }: ReviewStepProps) {
  const service = SERVICES[serviceId];
  const locationLines = formatDeliveryLines(location);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-navy-700">
        Check your request below. When you send it, WhatsApp opens with your full request ready to send.
      </p>
      <div className="flex items-center gap-3 rounded-2xl bg-navy-900 p-4 text-white">
        <service.icon className="h-6 w-6 text-red-400" aria-hidden="true" />
        <span className="font-extrabold tracking-wide">{service.title}</span>
      </div>
      <ReviewList title="Your request" fields={service.fields} values={values} />
      <ReviewList title="Contact" fields={CONTACT_FIELDS} values={values} />
      <section className="rounded-2xl border border-navy-100 p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Delivery location</h3>
        <ul className="mt-4 flex flex-col gap-2 text-sm font-semibold text-navy-900 sm:text-base">
          {locationLines.map((line) => (
            <li key={line} className="break-words">
              {line}
            </li>
          ))}
        </ul>
      </section>
      {service.messageNote && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-relaxed text-red-700">
          {service.messageNote}
        </p>
      )}
    </div>
  );
}
