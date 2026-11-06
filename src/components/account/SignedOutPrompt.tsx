import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">{children}</section>;
}
