import { SERVICE_LIST } from '@/data/services';

export default function ServiceOverview() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-navy-700">
        These are the services customers can order and the questions asked for each one. Service details are part of
        the website itself, so changes to wording or questions are made as a website update.
      </p>

      <ul className="grid gap-4 lg:grid-cols-2">
        {SERVICE_LIST.map((service) => {
          const Icon = service.icon;
          return (
            <li key={service.id} className="flex flex-col gap-5 rounded-3xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-extrabold text-navy-900">{service.title}</p>
                  <p className="text-sm text-navy-700">{service.headline}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-navy-600">Questions asked</p>
                <ul className="flex flex-col gap-1 text-sm text-navy-800">
                  {service.fields.map((field) => (
                    <li key={field.name}>
                      {field.label}
                      {field.required ? '' : ' (optional)'}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
