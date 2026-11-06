import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import Link from '@/components/layout/Link';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { signOut } from '@/lib/auth';
import { navigate } from '@/lib/navigation';

interface NavItem {
  to: string;
  label: string;
}

const PUBLIC_LINKS: NavItem[] = [
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/contact', label: 'Contact' },
];

const SIGNED_IN_LINKS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-orders', label: 'My orders' },
  { to: '/contact', label: 'Support' },
];

const NAV_LINK_CLASS = 'text-sm font-semibold text-navy-700 transition hover:text-red-500';
const MOBILE_LINK_CLASS = 'rounded-xl px-4 py-3 text-left text-base font-semibold text-navy-900 transition hover:bg-navy-50';

export default function Header() {
  const session = useCustomerSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const signedIn = session.status === 'signed-in';
  const links = signedIn ? SIGNED_IN_LINKS : PUBLIC_LINKS;
  const homeHref = signedIn ? '/dashboard' : '/';

  const handleSignOut = () => {
    closeMenu();
    signOut()
      .then(() => navigate('/'))
      .catch(() => window.alert('Could not sign out. Please try again.'));
  };

  const startOrder = () => {
    closeMenu();
    navigate('/order');
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white transition-shadow duration-300 ${
        scrolled ? 'border-navy-100 shadow-md shadow-navy-900/5' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={homeHref} aria-label="DREYPELLA CAMPUS home" onClick={closeMenu}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link
                to="/profile"
                className="hidden text-sm font-semibold text-navy-700 transition hover:text-red-500 lg:inline"
              >
                My profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-full px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-navy-50 md:inline-flex"
              >
                Log out
              </button>
            </>
          ) : (
            session.status === 'signed-out' && (
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-navy-50 md:inline-flex"
              >
                Sign in
              </Link>
            )
          )}
          <Button onClick={startOrder} className="hidden px-5 py-2.5 text-sm md:inline-flex">
            ORDER NOW
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-900 transition hover:bg-navy-50 md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-navy-100 bg-white transition-all duration-300 md:hidden ${
          menuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 border-transparent opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <Link key={link.label} to={link.to} onClick={closeMenu} className={MOBILE_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
          <Button onClick={startOrder} className="mt-2 w-full">
            ORDER NOW
          </Button>
          {signedIn ? (
            <>
              <Link to="/profile" onClick={closeMenu} className={MOBILE_LINK_CLASS}>
                My profile
              </Link>
              <button type="button" onClick={handleSignOut} className={MOBILE_LINK_CLASS}>
                Log out
              </button>
            </>
          ) : (
            session.status === 'signed-out' && (
              <Link to="/login" onClick={closeMenu} className={MOBILE_LINK_CLASS}>
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
