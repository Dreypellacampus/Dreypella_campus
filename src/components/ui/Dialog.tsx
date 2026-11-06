import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  eyebrow: string;
  title: string;
  onClose: () => void;
  progress?: { current: number; total: number } | null;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Dialog({ eyebrow, title, onClose, progress, footer, children }: DialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-dialog-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-900/60 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-navy-900/30 animate-fade-up sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-500">{eyebrow}</p>
            <h2 id="order-dialog-title" className="mt-1 text-lg font-extrabold text-navy-900 sm:text-xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {progress && (
          <div className="flex gap-2 px-5 pt-4 sm:px-8" aria-hidden="true">
            {Array.from({ length: progress.total }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  index <= progress.current ? 'bg-red-500' : 'bg-navy-100'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</div>

        {footer && (
          <footer className="flex items-center justify-between gap-3 border-t border-navy-100 px-5 py-4 sm:px-8">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
