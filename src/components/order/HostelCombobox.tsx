import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { Hostel } from '@/lib/hostels';
import type { HostelLoadStatus } from '@/hooks/useHostels';

interface HostelComboboxProps {
  id: string;
  label: string;
  value: string;
  hostels: Hostel[];
  status: HostelLoadStatus;
  error?: string;
  onChange: (value: string) => void;
}

const CONTROL =
  'w-full rounded-2xl border bg-white px-4 py-3 pr-11 text-base text-navy-900 placeholder:text-navy-400 transition duration-200 focus:outline-none focus:ring-4';

export default function HostelCombobox({ id, label, value, hostels, status, error, onChange }: HostelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = `${id}-list`;
  const messageId = `${id}-message`;

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    const names = hostels.map((hostel) => hostel.name);
    return query ? names.filter((name) => name.toLowerCase().includes(query)) : names;
  }, [hostels, value]);

  const showList = open && matches.length > 0;

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && showList) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === 'ArrowUp' && showList) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? matches.length - 1 : index - 1));
    } else if (event.key === 'Enter' && showList && activeIndex >= 0) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  const stateClass = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
    : 'border-navy-200 focus:border-navy-500 focus:ring-navy-100';

  let message: string | null = null;
  if (status === 'loading') message = 'Loading the hostel list...';
  else if (status === 'error') message = 'The hostel list is unavailable. Type your hostel name instead.';
  else if (hostels.length === 0) message = 'No hostels are listed yet. Type your hostel name.';
  else if (value.trim() && matches.length === 0) message = 'Not on the list? We will use the name you typed.';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-navy-900">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          type="text"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={message || error ? messageId : undefined}
          placeholder="Search or type your hostel"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className={`${CONTROL} ${stateClass}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-navy-500">
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </span>

        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-navy-100 bg-white p-2 shadow-xl shadow-navy-900/10"
          >
            {matches.map((name, index) => (
              <li
                key={name}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={name === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(name);
                }}
                className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  index === activeIndex || name === value
                    ? 'bg-red-50 text-red-700'
                    : 'text-navy-900 hover:bg-navy-50'
                }`}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p id={messageId} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : (
        message && (
          <p id={messageId} className="text-sm leading-relaxed text-navy-600">
            {message}
          </p>
        )
      )}
    </div>
  );
}
