import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { countBuyItems, EMPTY_BUY_ITEM, type BuyItem } from '@/lib/buyItems';

interface BuyItemRowsProps {
  items: BuyItem[];
  error?: string;
  onChange: (items: BuyItem[]) => void;
}

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function BuyItemRows({ items, error, onChange }: BuyItemRowsProps) {
  const updateRow = (index: number, patch: Partial<BuyItem>) => {
    onChange(items.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  };

  const removeRow = (index: number) => {
    const remaining = items.filter((_, position) => position !== index);
    onChange(remaining.length > 0 ? remaining : [EMPTY_BUY_ITEM]);
  };

  const count = countBuyItems(items);

  return (
    <section className="flex flex-col gap-4" aria-label="Items you need">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900">Items you need</h3>
        <span className="text-xs font-semibold text-navy-600">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>

      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-center gap-3">
          <input
            value={item.name}
            onChange={(event) => updateRow(index, { name: event.target.value })}
            placeholder="e.g. 2kg rice"
            aria-label={`Item ${index + 1} name`}
            maxLength={120}
            className={FIELD_CLASS}
          />
          <input
            value={item.quantity}
            onChange={(event) => updateRow(index, { quantity: event.target.value })}
            placeholder="Qty"
            inputMode="numeric"
            aria-label={`Item ${index + 1} quantity`}
            maxLength={6}
            className={FIELD_CLASS}
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label={`Remove item ${index + 1}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      <div>
        <Button
          variant="outline"
          onClick={() => onChange([...items, { ...EMPTY_BUY_ITEM }])}
          className="px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add another item
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
