import Logo from '@/components/ui/Logo';
import Link from '@/components/layout/Link';
import { WHATSAPP_DISPLAY_NUMBER } from '@/lib/whatsapp';

const FOOTER_LINKS = [
  { to: '/#services', label: 'Services' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms' },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo tone="light" />
          <p className="text-base font-semibold text-white">Your Campus. Your Needs. Delivered.</p>
          <p className="max-w-xs text-sm leading-relaxed text-navy-200">
            Shopping, printing, collection errands and delivery for LAUTECH students in Ogbomoso.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-wider text-white">Explore</p>
          {FOOTER_LINKS.map((link) => {
            const className = 'w-fit text-sm text-navy-100 transition hover:text-white hover:underline';
            return link.to.includes('#') ? (
              <a key={link.to} href={link.to} className={className}>
                {link.label}
              </a>
            ) : (
              <Link key={link.to} to={link.to} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-wider text-white">Reach us</p>
          <p className="text-sm">WhatsApp: {WHATSAPP_DISPLAY_NUMBER}</p>
          <p className="text-sm">Email: dreypellaride@gmail.com</p>
          <p className="text-sm">Opposite Dr. Oyewo House under G, Ogbomoso</p>
          <p className="mt-4 inline-flex w-fit items-center rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white">
            Powered by Dreypella
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-navy-200 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} DREYPELLA CAMPUS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
