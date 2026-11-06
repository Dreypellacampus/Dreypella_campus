import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import Button from '@/components/ui/Button';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import {
  createSavedAddress,
  deleteSavedAddress,
  fetchSavedAddresses,
  type SavedAddress,
} from '@/lib/savedAddressRepository';

const LABEL_MAX = 60;
const ADDRESS_MAX = 300;

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

type LoadState = { status: 'loading' } | { status: 'ready'; addresses: SavedAddress[] } | { status: 'error'; message: string };

export default function SavedAddressesPage() {
  const session = useCustomerSession();
  const userId = session.userId;
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchSavedAddresses()
      .then((addresses) => {
        if (active) setLoad({ status: 'ready', addresses });
      })
      .catch((caught: unknown) => {
        if (active) setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = label.trim();
    const trimmedAddress = address.trim();
    if (!trimmedLabel || !trimmedAddress) {
      setFormError('Enter a name for this address and the full address.');
      return;
    }
    if (trimmedLabel.length > LABEL_MAX || trimmedAddress.length > ADDRESS_MAX) {
      setFormError(`Keep the name under ${LABEL_MAX} characters and the address under ${ADDRESS_MAX}.`);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await createSavedAddress(trimmedLabel, trimmedAddress);
      setLabel('');
      setAddress('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'This address could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setRowError(null);
    try {
      await deleteSavedAddress(id);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setRowError(caught instanceof Error ? caught.message : 'This address could not be removed.');
    } finally {
      setRemovingId(null);
    }
  };

  if (!userId) {
    return (
      <PageShell>
        <p className="text-center text-sm text-navy-700">Checking your account...</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-12">
        <PageIntro eyebrow="Saved addresses" title="Your delivery addresses">
          <p>Save the places you often want orders delivered, so you can recognise them quickly when you order.</p>
        </PageIntro>

        <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-3xl border border-navy-100 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-navy-900">Add an address</h2>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
              Name
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={LABEL_MAX}
                placeholder="e.g. Hostel"
                className={FIELD_CLASS}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-navy-900">
              Full address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={ADDRESS_MAX}
                placeholder="Hostel name, block, and room"
                className={FIELD_CLASS}
              />
            </label>
          </div>
          {formError && (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {formError}
            </p>
          )}
          <div>
            <Button type="submit" disabled={saving} className="px-6 py-3 text-sm">
              {saving ? 'Saving...' : 'Save address'}
            </Button>
          </div>
        </form>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-navy-900">Saved</h2>
          {rowError && (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {rowError}
            </p>
          )}
          {load.status === 'loading' && <p className="text-sm text-navy-700">Loading your addresses...</p>}
          {load.status === 'error' && (
            <p role="alert" className="text-sm font-semibold text-red-600">
              Your addresses could not be loaded. {load.message}
            </p>
          )}
          {load.status === 'ready' && load.addresses.length === 0 && (
            <p className="text-sm text-navy-700">You have no saved addresses yet.</p>
          )}
          {load.status === 'ready' && load.addresses.length > 0 && (
            <ul className="flex flex-col gap-3">
              {load.addresses.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-navy-100 bg-white p-5"
                >
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-navy-900">{item.label}</p>
                      <p className="text-sm text-navy-700">{item.address}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    aria-label={`Remove ${item.label}`}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-navy-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
