import { CheckCircle2 } from 'lucide-react';
import { SERVICE_LIST, type ServiceId } from '@/data/services';

interface ServiceStepProps {
  selected: ServiceId | null;
  onSelect: (service: ServiceId) => void;
}

export default function ServiceStep({ selected, onSelect }: ServiceStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-navy-700">What do you need us to do?</p>
      <div role="group" aria-label="Choose a service" className="grid gap-3 sm:grid-cols-2">
        {SERVICE_LIST.map((service) => {
          const isSelected = selected === service.id;
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(service.id)}
              className={`group relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-red-500 bg-red-50 shadow-md shadow-red-500/10'
                  : 'border-navy-100 bg-white hover:border-navy-300'
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                  isSelected ? 'bg-red-500 text-white' : 'bg-navy-900 text-white'
                }`}
              >
                <service.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-extrabold tracking-wide text-navy-900">
                  {service.title}
                </span>
                <span className="mt-1 block text-sm leading-snug text-navy-700">
                  {service.headline}
                </span>
              </span>
              {isSelected && (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-red-500" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
