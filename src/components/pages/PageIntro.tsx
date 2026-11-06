import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}

export default function PageIntro({ eyebrow, title, children }: PageIntroProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-wider text-red-500">{eyebrow}</p>
      <h1 className="text-3xl font-extrabold leading-tight text-navy-900 sm:text-4xl">{title}</h1>
      {children && <div className="max-w-2xl text-base leading-relaxed text-navy-700">{children}</div>}
    </div>
  );
}
