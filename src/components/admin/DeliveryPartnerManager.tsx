import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { isNigerianMobile, normalizePhone } from '@/lib/phone';
import {
  addDeliveryPartner,
  fetchAllDeliveryPartners,
  setDeliveryPartnerActive,
  type DeliveryPartner,
} from '@/lib/deliveryPartnerRepository';

const INPUT =
  'w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

function toLocalWhatsApp(value: string): string {
  return normalizePhone(value).replace(/^\+?234/, '0');
}

export default function DeliveryPartnerManager() {
  const [partners, setPartners] = useState<DeliveryPartner[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAllDeliveryPartners()
      .then((items) => {
        if (active) {
          setPartners(items);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Enter the partner\u2019s email address.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Enter the partner\u2019s full name.');
      return;
    }
    if (!isNigerianMobile(whatsapp)) {
      setError('Enter a valid Nigerian WhatsApp number.');
      return;
    }

    setBusy(true);
    try {
      await addDeliveryPartner(trimmedEmail, trimmedName, toLocalWhatsApp(whatsapp));
      setEmail('');
      setFullName('');
      setWhatsapp('');
      setNotice(`${trimmedName} has been added as a delivery partner.`);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The delivery partner could not be added.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (partner: DeliveryPartner) => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await setDeliveryPartnerActive(partner.id, !partner.active);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The partner status could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-2xl border border-navy-100 p-5">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">Add a delivery partner</h2>
          <p className="mt-1 text-sm leading-relaxed text-navy-700">
            The partner must sign up on the website first with this email. Then add them here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-navy-900">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="partner@example.com"
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-navy-900">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-navy-900">WhatsApp number</span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="08012345678"
              className={INPUT}
            />
          </label>
        </div>
        <Button type="submit" disabled={busy} className="w-fit px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Saving...' : 'Add partner'}
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      )}

      {loadError && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          The delivery partner list could not be loaded.
        </p>
      )}
      {!loadError && partners === null && <p className="text-sm text-navy-700">Loading delivery partners...</p>}

      {partners !== null && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">
            Delivery partners ({partners.length})
          </h3>
          {partners.length === 0 && <p className="text-sm text-navy-600">No delivery partners added yet.</p>}
          <ul className="flex flex-col divide-y divide-navy-100 rounded-2xl border border-navy-100">
            {partners.map((partner) => (
              <li key={partner.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-navy-900">{partner.full_name}</span>
                  <span className="text-sm text-navy-700">{partner.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      partner.active ? 'bg-emerald-50 text-emerald-800' : 'bg-navy-100 text-navy-700'
                    }`}
                  >
                    {partner.active ? 'Active' : 'Paused'}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handleToggleActive(partner)}
                    disabled={busy}
                    className="px-4 py-2 text-sm"
                  >
                    {partner.active ? 'Pause access' : 'Restore access'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
