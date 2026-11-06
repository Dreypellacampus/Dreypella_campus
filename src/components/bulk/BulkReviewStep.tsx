import type { ReactNode } from 'react';
import { formatDeliveryLines } from '@/lib/deliveryLocation';
import { formatDisplayDate, formatNaira } from '@/lib/format';
import { priceLineItems } from '@/lib/pricing';
import type { BulkOrderPayload } from '@/lib/bulkOrder';
import type { PriceItem } from '@/lib/priceRepository';
import Button from '@/components/ui/Button';

interface BulkReviewStepProps {
  reference: string;
  payload: BulkOrderPayload;
  prices: ReadonlyArray<PriceItem>;
  pricesStatus: 'loading' | 'ready' | 'error';
  onRetryPrices: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy-100 p-5">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="text-sm font-semibold text-navy-600 sm:w-44 sm:shrink-0">{label}</span>
      <span className="whitespace-pre-line break-words text-sm font-semibold text-navy-900 sm:text-base">
        {value}
      </span>
    </div>
  );
}

export default function BulkReviewStep({ reference, payload, prices, pricesStatus, onRetryPrices }: BulkReviewStepProps) {
  const pricing = priceLineItems(payload.items, prices);
  const priceText = (amount: number | null) => {
    if (pricesStatus !== 'ready') return '...';
    return amount === null ? 'Request a Quote' : formatNaira(amount);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-2xl bg-navy-900 p-4 text-white">
        <span className="text-xs font-bold uppercase tracking-wider text-red-300">Reference number</span>
        <span className="text-lg font-extrabold tracking-wide">{reference}</span>
      </div>

      <Section title="Customer">
        <Row label="Customer / organization" value={payload.customer_name} />
        <Row label="Contact person" value={payload.contact_name} />
        <Row label="WhatsApp" value={payload.whatsapp} />
        {payload.organization && <Row label="Department / hostel" value={payload.organization} />}
        <Row label="Service type" value={payload.service_type} />
      </Section>

      <Section title={`Items (${payload.items.length})`}>
        <ul className="flex flex-col divide-y divide-navy-100">
          {payload.items.map((item, index) => {
            const line = pricing.lines[index];
            return (
              <li key={`${item.name}-${index}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <div>
                  <p className="text-sm font-bold text-navy-900">
                    {item.name} <span className="font-semibold text-navy-600">x {item.quantity}</span>
                  </p>
                  {item.specs && <p className="mt-1 text-sm text-navy-600">{item.specs}</p>}
                </div>
                <p className="text-sm font-bold text-navy-900">{priceText(line.subtotal)}</p>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-navy-100 pt-3">
          <span className="text-sm font-extrabold text-navy-900">Estimated total</span>
          <span className="text-base font-extrabold text-navy-900">{priceText(pricing.total)}</span>
        </div>
        <p className="text-xs leading-relaxed text-navy-600">
          A total appears only when every item has a confirmed price. Otherwise our team will send you a quote.
        </p>
        {pricesStatus === 'loading' && <p className="text-xs font-semibold text-navy-700">Loading prices...</p>}
        {pricesStatus === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            Prices could not be loaded, so the request cannot be sent yet.
            <Button variant="outline" onClick={onRetryPrices} className="px-4 py-2 text-xs">
              Try again
            </Button>
          </div>
        )}
      </Section>

      <Section title="Delivery">
        {formatDeliveryLines(payload.delivery_location).map((line) => (
          <p key={line} className="break-words text-sm font-semibold text-navy-900 sm:text-base">
            {line}
          </p>
        ))}
        <Row label="Required date" value={formatDisplayDate(payload.delivery_date)} />
        <Row label="Required time" value={payload.delivery_time} />
        {payload.budget && <Row label="Budget" value={payload.budget} />}
        {payload.instructions && <Row label="Instructions" value={payload.instructions} />}
      </Section>
    </div>
  );
}
