import { Truck } from 'lucide-react';

interface LogoProps {
  tone?: 'dark' | 'light';
}

export default function Logo({ tone = 'dark' }: LogoProps) {
  const isLight = tone === 'light';

  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-500/30">
        <Truck className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`text-base font-extrabold tracking-wide sm:text-lg ${isLight ? 'text-white' : 'text-navy-900'}`}
        >
          DREYPELLA <span className="text-red-500">CAMPUS</span>
        </span>
        <span
          className={`mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-navy-200' : 'text-navy-600'}`}
        >
          Campus Delivery
        </span>
      </span>
    </span>
  );
}
