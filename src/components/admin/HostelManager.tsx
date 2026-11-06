import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useHostels } from '@/hooks/useHostels';
import { addHostel, removeHostel, renameHostel, type Hostel, type HostelKind } from '@/lib/hostels';

const KIND_LABELS: Record<HostelKind, string> = {
  'on-campus': 'On-campus hostels',
  'off-campus': 'Off-campus hostels',
};

const INPUT =
  'w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function HostelManager() {
  const { hostels, status, reload } = useHostels();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HostelKind>('on-campus');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter the hostel name.');
      return;
    }
    run(async () => {
      await addHostel(trimmed, kind);
      setName('');
    });
  };

  const handleRename = (hostel: Hostel) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError('Enter the hostel name.');
      return;
    }
    run(async () => {
      await renameHostel(hostel.id, trimmed);
      setEditingId(null);
    });
  };

  const groups: HostelKind[] = ['on-campus', 'off-campus'];

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl border border-navy-100 p-5 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-bold text-navy-900">Hostel name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter the exact hostel name"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-2 sm:w-48">
          <span className="text-sm font-bold text-navy-900">Type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as HostelKind)} className={INPUT}>
            <option value="on-campus">On-campus</option>
            <option value="off-campus">Off-campus</option>
          </select>
        </label>
        <Button type="submit" disabled={busy} className="px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add hostel
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {status === 'loading' && <p className="text-sm text-navy-700">Loading hostels...</p>}
      {status === 'error' && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          The hostel list could not be loaded.
        </p>
      )}

      {status === 'ready' &&
        groups.map((group) => {
          const items = hostels.filter((hostel) => hostel.location_type === group);
          return (
            <section key={group} className="flex flex-col gap-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">
                {KIND_LABELS[group]} ({items.length})
              </h3>
              {items.length === 0 && <p className="text-sm text-navy-600">None listed yet.</p>}
              <ul className="flex flex-col divide-y divide-navy-100 rounded-2xl border border-navy-100">
                {items.map((hostel) => (
                  <li key={hostel.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    {editingId === hostel.id ? (
                      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          aria-label="New hostel name"
                          className={INPUT}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleRename(hostel)} disabled={busy} className="px-4 py-2 text-sm">
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm">
                            <X className="h-4 w-4" aria-hidden="true" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-navy-900">{hostel.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(hostel.id);
                              setEditName(hostel.name);
                              setConfirmId(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Rename
                          </button>
                          {confirmId === hostel.id ? (
                            <button
                              type="button"
                              onClick={() => run(() => removeHostel(hostel.id).then(() => setConfirmId(null)))}
                              disabled={busy}
                              className="rounded-full bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-red-600"
                            >
                              Confirm remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmId(hostel.id)}
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Remove
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
