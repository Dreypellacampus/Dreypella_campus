import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchActiveInstitutions, type Institution } from '@/lib/institutionRepository';

interface InstitutionPickerProps {
  value: string;
  nameValue: string;
  onChange: (id: string, name: string) => void;
  required?: boolean;
  error?: string;
}

export default function InstitutionPicker({ value, nameValue, onChange, required = false, error }: InstitutionPickerProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [query, setQuery] = useState(nameValue);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchActiveInstitutions()
      .then((items) => {
        if (active) setInstitutions(items);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setQuery(nameValue);
  }, [nameValue]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return institutions;
    return institutions.filter((item) => `${item.name} ${item.town}`.toLowerCase().includes(normalized));
  }, [institutions, query]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="institution-search" className="text-sm font-bold text-navy-900">
        Institution {required ? <span className="text-red-500">*</span> : <span className="font-normal text-navy-600">(optional for non-students)</span>}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" aria-hidden="true" />
        <input
          id="institution-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange('', event.target.value);
          }}
          placeholder="Search active institutions"
          className="w-full rounded-2xl border border-navy-200 bg-white py-3 pl-11 pr-4 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>
      {loadError && <p className="text-sm text-red-600">Institutions could not be loaded. You can continue without one.</p>}
      {!loadError && query.trim() && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-navy-100 bg-white shadow-sm">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery(item.name);
                onChange(item.id, item.name);
              }}
              className={`flex w-full flex-col px-4 py-3 text-left transition hover:bg-navy-50 ${item.id === value ? 'bg-navy-50' : ''}`}
            >
              <span className="text-sm font-bold text-navy-900">{item.name}</span>
              <span className="text-xs text-navy-600">{item.institution_type} · {item.town}</span>
            </button>
          ))}
        </div>
      )}
      {value && <p className="text-xs font-semibold text-emerald-700">Selected: {nameValue}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      {!value && query.trim() && filtered.length === 0 && <p className="text-xs text-navy-600">Not listed? Leave this blank and enter the name for review below.</p>}
    </div>
  );
}
