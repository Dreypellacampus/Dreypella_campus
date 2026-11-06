import { ImagePlus, X } from 'lucide-react';

interface ReferenceImageFieldProps {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}

export default function ReferenceImageField({ file, error, onChange }: ReferenceImageFieldProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Reference image">
      <div>
        <h3 className="text-sm font-bold text-navy-900">Reference image (optional)</h3>
        <p className="mt-1 text-xs leading-relaxed text-navy-600">
          A photo of the item or brand you want, JPEG, PNG or WebP up to 5 MB.
        </p>
      </div>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-navy-200 bg-white px-4 py-3">
          <span className="truncate text-sm font-semibold text-navy-900">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove reference image"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-navy-300 bg-mist px-4 py-4 text-sm font-semibold text-navy-800 transition hover:border-navy-500 hover:bg-navy-50">
          <ImagePlus className="h-5 w-5 text-navy-700" aria-hidden="true" />
          Choose an image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              onChange(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
