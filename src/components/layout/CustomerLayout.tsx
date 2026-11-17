import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  FileText,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import Link from '@/components/layout/Link';
import Logo from '@/components/ui/Logo';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { signOut } from '@/lib/auth';
import { isAdminUser } from '@/lib/adminAuth';
import { fetchDeliveryPartner } from '@/lib/deliveryPartnerRepository';
import { fetchNotifications } from '@/lib/notificationRepository';
import { navigate } from '@/lib/navigation';

interface CustomerLayoutProps {
  pathname: string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/order', label: 'Place an order', icon: PlusCircle },
  { to: '/my-orders', label: 'My orders', icon: History },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/addresses', label: 'Saved addresses', icon: MapPin },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My profile', icon: UserRound },
  { to: '/contact', label: 'Help & support', icon: LifeBuoy },
] as const;

const PARTNER_NAV_ITEM = { to: '/delivery', label: 'Deliveries', icon: Truck } as const;
const ADMIN_NAV_ITEM = { to: '/admin', label: 'Admin dashboard', icon: ShieldCheck } as const;

function NavList({
  pathname,
  unreadCount,
  isAdmin,
  isPartner,
  onNavigate,
}: {
  pathname: string;
  unreadCount: number;
  isAdmin: boolean;
  isPartner: boolean;
  onNavigate?: () => void;
}) {
  const items = [
    ...NAV_ITEMS,
    ...(isPartner ? [PARTNER_NAV_ITEM] : []),
    ...(isAdmin ? [ADMIN_NAV_ITEM] : []),
  ];
  return (
    <nav aria-label="Customer menu" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              active ? 'bg-white text-navy-900 shadow-sm' : 'text-white/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/notifications' && unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CustomerLayout({ pathname, children }: CustomerLayoutProps) {
  const session = useCustomerSession();
  const userId = session.userId;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    isAdminUser(userId)
      .then((admin) => {
        if (active) setIsAdmin(admin);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchDeliveryPartner(userId)
      .then((partner) => {
        if (active) setIsPartner(partner?.active === true);
      })
      .catch(() => {
        if (active) setIsPartner(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchNotifications()
      .then((items) => {
        if (active) setUnreadCount(items.filter((item) => item.read_at === null).length);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });
    return () => {
      active = false;
    };
  }, [userId, pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleSignOut = () => {
    setSigningOut(true);
    signOut()
      .then(() => navigate('/'))
      .catch(() => window.alert('Could not sign out. Please try again.'))
      .finally(() => setSigningOut(false));
  };

  const logoutButton = (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {signingOut ? 'Logging out...' : 'Log out'}
    </button>
  );

  return (
    <div className="min-h-screen bg-mist lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col justify-between bg-navy-900 p-6 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="flex flex-col gap-8">
          <Link to="/" className="flex items-center gap-3 text-white">
            <Logo tone="light" />
          </Link>
          <NavList pathname={pathname} unreadCount={unreadCount} isAdmin={isAdmin} isPartner={isPartner} />
        </div>
        <div className="border-t border-white/10 pt-4">{logoutButton}</div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-navy-900/60"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-navy-900 p-6 shadow-2xl">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <Logo tone="light" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <NavList
                pathname={pathname}
                unreadCount={unreadCount}
                isAdmin={isAdmin}
                isPartner={isPartner}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="border-t border-white/10 pt-4">{logoutButton}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-full p-2 text-navy-900 hover:bg-navy-50 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="hidden min-w-0 flex-1 lg:block" />
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative rounded-full p-2 text-navy-900 hover:bg-navy-50"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>
            <span className="hidden max-w-[16rem] truncate text-sm font-semibold text-navy-800 sm:block">
              {session.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 px-3 py-2 text-xs font-bold text-navy-900 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 lg:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signingOut ? 'Signing out' : 'Log out'}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
