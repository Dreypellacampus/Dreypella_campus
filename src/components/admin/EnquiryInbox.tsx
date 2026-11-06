import { useEffect, useState } from 'react';
import EnquiryDetail from '@/components/admin/EnquiryDetail';
import { formatOrderDateTime } from '@/lib/individualOrderDisplay';
import { fetchEnquiries, type EnquiryFilter, type EnquiryRow } from '@/lib/enquiryRepository';

const FILTERS: { value: EnquiryFilter; label: string }[] = [
  { value: 'all', label: 'All messages' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'answered', label: 'Answered' },
  { value: 'archived', label: 'Archived' },
];

interface EnquiryInboxProps {
  onChanged: () => void;
}

export default function EnquiryInbox({ onChanged }: EnquiryInboxProps) {
  const [filter, setFilter] = useState<EnquiryFilter>('unanswered');
  const [rows, setRows] = useState<EnquiryRow[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    fetchEnquiries(filter)
      .then((items) => {
        if (active) {
          setRows(items);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [filter, reloadKey]);

  const openRow = rows?.find((row) => row.id === openId) ?? null;

  const handleChanged = () => {
    setReloadKey((key) => key + 1);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Filter messages" className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = item.value === filter;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-800 hover:bg-navy-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Messages could not be loaded. Refresh the page to try again.
        </p>
      )}
      {!error && rows === null && <p className="text-sm text-navy-700">Loading messages...</p>}
      {rows !== null && rows.length === 0 && <p className="text-sm text-navy-600">No messages here.</p>}

      {rows !== null && rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(row.id)}
                className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-navy-50 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                    {row.status === 'unanswered' && row.archived_at === null && (
                      <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                    )}
                    {row.customer_name}
                  </span>
                  <span className="text-xs text-navy-600">{formatOrderDateTime(row.created_at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-navy-100 px-2.5 py-1 text-navy-800">{row.category}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 ${
                      row.status === 'unanswered' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {row.archived_at ? 'Archived' : row.status === 'unanswered' ? 'Unanswered' : 'Answered'}
                  </span>
                  {row.order_reference && <span className="text-navy-600">Ref {row.order_reference}</span>}
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-navy-700">{row.message}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openRow && (
        <EnquiryDetail
          key={openRow.id}
          enquiry={openRow}
          onClose={() => setOpenId(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
