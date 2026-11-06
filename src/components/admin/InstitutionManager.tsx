import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Search, Users, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import {
  fetchInstitutionsWithCounts,
  saveInstitution,
  setInstitutionActive,
  type InstitutionType,
  type InstitutionWithCount,
} from '@/lib/institutionRepository';
import { fetchCustomerProfiles } from '@/lib/customerProfileRepository';
import type { CustomerProfile } from '@/lib/customerProfile';
import { formatDisplayDate } from '@/lib/format';

type LoadState = 'loading' | 'ready' | 'error';

const INSTITUTION_TYPES: InstitutionType[] = ['University', 'Polytechnic', 'College of Education', 'Other'];

const INPUT_CLASS =
  'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

interface FormState {
  id: string | null;
  name: string;
  institution_type: InstitutionType;
  location: string;
  town: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  institution_type: 'University',
  location: '',
  town: '',
  active: true,
};

export default function InstitutionManager() {
  const [institutions, setInstitutions] = useState<InstitutionWithCount[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'inactive'>('All');
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailInstitution, setDetailInstitution] = useState<InstitutionWithCount | null>(null);
  const [detailCustomers, setDetailCustomers] = useState<CustomerProfile[] | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setInstitutions(await fetchInstitutionsWithCounts());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (typeFilter !== 'All' && inst.institution_type !== typeFilter) return false;
      if (statusFilter === 'active' && !inst.active) return false;
      if (statusFilter === 'inactive' && inst.active) return false;
      if (term && !`${inst.name} ${inst.town} ${inst.location}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [institutions, query, typeFilter, statusFilter]);

  const openAdd = () => {
    setEditing({ ...EMPTY_FORM });
    setFormError(null);
  };

  const openEdit = (inst: InstitutionWithCount) => {
    setEditing({
      id: inst.id,
      name: inst.name,
      institution_type: inst.institution_type,
      location: inst.location,
      town: inst.town,
      active: inst.active,
    });
    setFormError(null);
  };

  const closeForm = () => {
    setEditing(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.name.trim().length < 2) {
      setFormError('Institution name is required (at least 2 characters).');
      return;
    }
    if (editing.location.trim().length < 2) {
      setFormError('Location is required.');
      return;
    }
    if (editing.town.trim().length < 2) {
      setFormError('Town is required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await saveInstitution({
        id: editing.id ?? undefined,
        name: editing.name.trim(),
        institution_type: editing.institution_type,
        location: editing.location.trim(),
        town: editing.town.trim(),
        active: editing.active,
      });
      closeForm();
      await load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Institution could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (inst: InstitutionWithCount) => {
    try {
      await setInstitutionActive(inst.id, !inst.active);
      await load();
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : 'Could not change institution status.');
    }
  };

  const openDetail = async (inst: InstitutionWithCount) => {
    setDetailInstitution(inst);
    setDetailCustomers(null);
    try {
      const all = await fetchCustomerProfiles();
      setDetailCustomers(all.filter((c) => c.institution_id === inst.id));
    } catch {
      setDetailCustomers([]);
    }
  };

  if (loadState === 'loading') return <p className="text-sm text-navy-700">Loading institutions...</p>;
  if (loadState === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm font-semibold text-red-600">
          Institutions could not be loaded. Please try again.
        </p>
        <button type="button" onClick={load} className="text-sm font-bold text-navy-900 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search institutions"
              aria-label="Search institutions"
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as InstitutionType | 'All')}
            className={INPUT_CLASS}
            aria-label="Filter by type"
          >
            <option value="All">All types</option>
            {INSTITUTION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'All' | 'active' | 'inactive')}
            className={INPUT_CLASS}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button onClick={openAdd} className="px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add institution
        </Button>
      </div>

      {institutions.length === 0 && (
        <p className="rounded-2xl bg-mist p-6 text-center text-sm text-navy-700">
          No institutions yet. Click "Add institution" to create the first one.
        </p>
      )}

      {institutions.length > 0 && visible.length === 0 && (
        <p className="text-sm text-navy-700">No institutions match your search.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((inst) => (
          <li key={inst.id} className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-5 lg:grid-cols-[1fr_auto_auto_auto]">
            <button type="button" onClick={() => openDetail(inst)} className="flex flex-col gap-1 text-left">
              <span className="flex items-center gap-2 text-base font-bold text-navy-900">
                <Building2 className="h-4 w-4 text-navy-600" aria-hidden="true" />
                {inst.name}
              </span>
              <span className="text-sm text-navy-600">{inst.institution_type} · {inst.location}, {inst.town}</span>
              <span className="text-xs text-navy-500">Added {formatDisplayDate(inst.created_at)}</span>
            </button>
            <span className="flex items-center gap-2 text-sm font-bold text-navy-700">
              <Users className="h-4 w-4 text-navy-500" aria-hidden="true" />
              {inst.customer_count}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${inst.active ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-600'}`}>
              {inst.active ? 'Active' : 'Inactive'}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openEdit(inst)} className="rounded-full p-2 text-navy-600 transition hover:bg-navy-50" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggle(inst)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:bg-navy-50"
              >
                {inst.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <Dialog
          eyebrow={editing.id ? 'Edit institution' : 'New institution'}
          title={editing.id ? editing.name : 'Add an institution'}
          onClose={closeForm}
        >
          <div className="flex flex-col gap-4">
            {formError && (
              <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{formError}</p>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="inst-name" className="text-sm font-bold text-navy-900">Institution name</label>
              <input
                id="inst-name"
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className={INPUT_CLASS}
                placeholder="For example, LAUTECH"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="inst-type" className="text-sm font-bold text-navy-900">Institution type</label>
              <select
                id="inst-type"
                value={editing.institution_type}
                onChange={(event) => setEditing({ ...editing, institution_type: event.target.value as InstitutionType })}
                className={INPUT_CLASS}
              >
                {INSTITUTION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="inst-location" className="text-sm font-bold text-navy-900">Location</label>
              <input
                id="inst-location"
                value={editing.location}
                onChange={(event) => setEditing({ ...editing, location: event.target.value })}
                className={INPUT_CLASS}
                placeholder="Campus area or address"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="inst-town" className="text-sm font-bold text-navy-900">Town</label>
              <input
                id="inst-town"
                value={editing.town}
                onChange={(event) => setEditing({ ...editing, town: event.target.value })}
                className={INPUT_CLASS}
                placeholder="For example, Ogbomoso"
              />
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-navy-900">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) => setEditing({ ...editing, active: event.target.checked })}
                className="h-4 w-4 rounded border-navy-300"
              />
              Active (available for customer selection)
            </label>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm">
                {saving ? 'Saving...' : 'Save institution'}
              </Button>
              <Button variant="outline" onClick={closeForm} className="px-5 py-2.5 text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {detailInstitution && (
        <Dialog
          eyebrow="Institution details"
          title={detailInstitution.name}
          onClose={() => setDetailInstitution(null)}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-500">Type</p>
                <p className="font-semibold text-navy-900">{detailInstitution.institution_type}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-500">Status</p>
                <p className={`font-semibold ${detailInstitution.active ? 'text-emerald-700' : 'text-navy-600'}`}>
                  {detailInstitution.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-500">Location</p>
                <p className="font-semibold text-navy-900">{detailInstitution.location}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-500">Town</p>
                <p className="font-semibold text-navy-900">{detailInstitution.town}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-500">Registered customers</p>
                <p className="text-2xl font-extrabold text-navy-900">{detailInstitution.customer_count}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Customers</h3>
              {detailCustomers === null && <p className="text-sm text-navy-600">Loading customers...</p>}
              {detailCustomers !== null && detailCustomers.length === 0 && (
                <p className="text-sm text-navy-600">No customers have selected this institution yet.</p>
              )}
              {detailCustomers && detailCustomers.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {detailCustomers.map((customer) => (
                    <li key={customer.id} className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-navy-900">{customer.full_name}</span>
                        <span className="text-xs text-navy-600">{customer.whatsapp}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 text-xs text-navy-600">
                        <span>{customer.customer_category ?? 'No category'}</span>
                        {customer.department && <span>{customer.department}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
