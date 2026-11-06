import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { createReferenceImageUrl } from '@/lib/referenceImage';

interface ReferenceImageLinkProps {
  path: string;
}

export default function ReferenceImageLink({ path }: ReferenceImageLinkProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await createReferenceImageUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The image could not be opened.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-navy-900 underline-offset-4 hover:underline disabled:opacity-60"
      >
        <ImageIcon className="h-4 w-4" aria-hidden="true" />
        {busy ? 'Opening image...' : 'View reference image'}
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
