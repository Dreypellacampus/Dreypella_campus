import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchCustomerProfiles } from '@/lib/customerProfileRepository';
import type { CustomerProfile } from '@/lib/customerProfile';

type LoadState = { status: 'loading' } | { status: 'ready'; customers: CustomerProfile[] } | { status: 'error'; message: string };

const FIELD_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 pl-11 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function CustomerList() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [query, setQuery] = useState('');

  const loadCustomers = () => {
    setLoad({ status: 'loading' });
    fetchCustomerProfiles()
      .then((customers) => setLoad({ status: 'ready', customers }))
      .catch((caught: unknown) =>
        setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' })
      );
  };

  useEffect(() => {
    let active = true;
    fetchCustomerProfiles()
      .then((customers) => {
        if (active) setLoad({ status: 'ready', customers });
      })
      .catch((caught: unknown) => {
        if (active) setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (load.status !== 'ready') return [];
    const term = query.trim().toLowerCase();
    if (!term) return load.customers;
    return load.customers.filter((customer) =>
      [customer.full_name, customer.whatsapp, customer.institution ?? '', customer.department ?? '']
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [load, query]);

  if (load.status === 'loading') return <p className="text-sm text-navy-700">Loading customers...</p>;

  if (load.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm font-semibold text-red-600">
          Customers could not be loaded. {load.message}
        </p>
        <button type="button" onClick={loadCustomers} className="text-sm font-bold text-navy-900 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, WhatsApp, or institution"
          aria-label="Search customers"
          className={FIELD_CLASS}
        />
      </div>

      {load.customers.length === 0 && <p className="text-sm text-navy-700">No customers have signed up yet.</p>}
      {load.customers.length > 0 && visible.length === 0 && (
        <p className="text-sm text-navy-700">No customers match your search.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((customer) => (
          <li
            key={`${customer.full_name}-${customer.whatsapp}`}
            className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold text-navy-900">{customer.full_name}</p>
              <p className="text-sm text-navy-700">{customer.whatsapp}</p>
            </div>
            <div className="flex flex-col gap-1 text-sm text-navy-700">
              <p>{[customer.institution, customer.department].filter(Boolean).join(' - ') || 'No institution given'}</p>
              <p>{customer.student_status || 'Status not given'}</p>
            </div>
            <p className="text-sm text-navy-700">{customer.preferred_address || 'No preferred address'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
