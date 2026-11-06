import { useState, type FormEvent } from 'react';
import { Save, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usePriceCatalog } from '@/hooks/usePriceCatalog';
import { formatNaira } from '@/lib/format';
import {
  createPriceItem,
  deletePriceItem,
  updatePriceItem,
  type PriceItem,
  type PriceItemInput,
} from '@/lib/priceRepository';

type Notice = { tone: 'ok' | 'error'; text: string } | null;

const FIELD_CLASS =
  'rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

const MAX_PRICE = 100000000;

function parsePriceInput(name: string, price: string): PriceItemInput | string {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 120) return 'Enter an item name of 2 to 120 characters.';
  if (price.trim() === '') return 'Enter a price in whole naira.';
  const amount = Number(price);
  if (!Number.isInteger(amount) || amount < 0 || amount > MAX_PRICE) {
    return `Enter a whole-naira price between 0 and ${MAX_PRICE.toLocaleString('en-NG')}.`;
  }
  return { name: trimmedName, unit_price: amount };
}

function PriceRow({ item, onResult }: { item: PriceItem; onResult: (notice: Notice) => void }) {
  const [draft, setDraft] = useState(String(item.unit_price));
  const [busy, setBusy] = useState(false);
  const unchanged = draft === String(item.unit_price);

  const handleSave = async () => {
    const input = parsePriceInput(item.name, draft);
    if (typeof input === 'string') {
      onResult({ tone: 'error', text: input });
      return;
    }
    setBusy(true);
    try {
      await updatePriceItem(item.id, input);
      onResult({ tone: 'ok', text: `${item.name} price saved.` });
    } catch (caught) {
      onResult({ tone: 'error', text: caught instanceof Error ? caught.message : 'The price could not be saved.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Remove the price for ${item.name}? Requests with this item will show "Request a Quote".`)) return;
    setBusy(true);
    try {
      await deletePriceItem(item.id);
      onResult({ tone: 'ok', text: `${item.name} removed.` });
    } catch (caught) {
      onResult({ tone: 'error', text: caught instanceof Error ? caught.message : 'The price could not be removed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-navy-900">{item.name}</span>
        <span className="text-xs text-navy-600">Current: {formatNaira(item.unit_price)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
          Price (NGN)
          <input
            type="number"
            min={0}
            step={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={`Price for ${item.name}`}
            className={`${FIELD_CLASS} w-36`}
          />
        </label>
        <Button onClick={handleSave} disabled={busy || unchanged} className="px-4 py-2 text-xs">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save
        </Button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          aria-label={`Remove ${item.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-navy-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export default function PriceManager() {
  const { state, reload } = usePriceCatalog();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const handleResult = (result: Notice) => {
    setNotice(result);
    if (result?.tone === 'ok') reload();
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = parsePriceInput(name, price);
    if (typeof input === 'string') {
      setNotice({ tone: 'error', text: input });
      return;
    }
    setBusy(true);
    try {
      await createPriceItem(input);
      setName('');
      setPrice('');
      handleResult({ tone: 'ok', text: `${input.name} added.` });
    } catch (caught) {
      setNotice({ tone: 'error', text: caught instanceof Error ? caught.message : 'The price could not be saved.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-mist p-5 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-bold text-navy-900">
          Item name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-navy-900 sm:w-44">
          Price (NGN)
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <Button type="submit" disabled={busy} className="px-5 py-2.5 text-sm">
          {busy ? 'Adding...' : 'Add price'}
        </Button>
      </form>

      {notice && (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl p-4 text-sm font-semibold ${
            notice.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      {state.status === 'loading' && <p className="text-sm text-navy-700">Loading prices...</p>}

      {state.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Prices could not be loaded. Check the database connection and try again.
          <Button variant="outline" onClick={reload} className="px-4 py-2 text-xs">
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.prices.length === 0 && (
        <p className="rounded-2xl bg-mist p-6 text-center text-sm text-navy-700">
          No prices yet. Items without a price show &quot;Request a Quote&quot;.
        </p>
      )}

      {state.status === 'ready' && state.prices.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.prices.map((item) => (
            <PriceRow key={`${item.id}-${item.unit_price}`} item={item} onResult={handleResult} />
          ))}
        </ul>
      )}
    </div>
  );
}
