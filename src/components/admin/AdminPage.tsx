import { type ReactNode } from 'react';
import { Building2, ClipboardList, FileText, LogOut, MapPinned, MessageSquare, Package, ShieldAlert, Tags, Truck, Users } from 'lucide-react';
import AdminSignIn from '@/components/admin/AdminSignIn';
import BulkRequestList from '@/components/admin/BulkRequestList';
import CustomerList from '@/components/admin/CustomerList';
import DeliveryPartnerManager from '@/components/admin/DeliveryPartnerManager';
import EnquiryInbox from '@/components/admin/EnquiryInbox';
import HostelManager from '@/components/admin/HostelManager';
import IndividualOrderList from '@/components/admin/IndividualOrderList';
import InstitutionManager from '@/components/admin/InstitutionManager';
import PriceManager from '@/components/admin/PriceManager';
import ServiceOverview from '@/components/admin/ServiceOverview';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import Link from '@/components/layout/Link';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useUnansweredCount } from '@/hooks/useUnansweredCount';
import { signOut } from '@/lib/auth';

export type AdminSection =
  | 'bulk-requests' | 'orders' | 'customers' | 'services' | 'pricing'
  | 'locations' | 'partners' | 'messages' | 'institutions';

const MAIN_SECTIONS = [
  { value: 'bulk-requests', label: 'Bulk requests', icon: Package },
  { value: 'orders', label: 'Individual orders', icon: ClipboardList },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'services', label: 'Services', icon: FileText },
  { value: 'pricing', label: 'Prices', icon: Tags },
  { value: 'locations', label: 'Hostels', icon: MapPinned },
  { value: 'partners', label: 'Delivery partners', icon: Truck },
  { value: 'institutions', label: 'Institutions', icon: Building2 },
  { value: 'messages', label: 'Messages', icon: MessageSquare },
] satisfies { value: AdminSection; label: string; icon: typeof Package }[];
const INSTITUTION_SECTIONS = [
  { value: 'bulk-requests', label: 'Bulk requests', icon: Package },
  { value: 'orders', label: 'Individual orders', icon: ClipboardList },
  { value: 'customers', label: 'Customers', icon: Users },
] satisfies { value: AdminSection; label: string; icon: typeof Package }[];

function AdminShell({ children, email, onSignOut }: { children: ReactNode; email?: string; onSignOut?: () => void }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Back to the website"><Logo /></Link>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-sm text-navy-600 sm:inline">{email}</span>}
            {onSignOut && <Button variant="outline" onClick={onSignOut} className="px-4 py-2 text-sm"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</Button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-navy-100 bg-white p-8 text-center shadow-xl shadow-navy-900/5"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500"><ShieldAlert className="h-5 w-5" aria-hidden="true" /></span><h2 className="text-xl font-extrabold text-navy-900">{title}</h2><div className="text-sm leading-relaxed text-navy-700">{children}</div></div>;
}

function SectionContent({ section, onMessagesChanged }: { section: AdminSection; onMessagesChanged: () => void }) {
  if (section === 'bulk-requests') return <BulkRequestList />;
  if (section === 'orders') return <IndividualOrderList />;
  if (section === 'customers') return <CustomerList />;
  if (section === 'services') return <ServiceOverview />;
  if (section === 'pricing') return <PriceManager />;
  if (section === 'partners') return <DeliveryPartnerManager />;
  if (section === 'institutions') return <InstitutionManager />;
  if (section === 'messages') return <EnquiryInbox onChanged={onMessagesChanged} />;
  return <HostelManager />;
}

export default function AdminPage({ section }: { section: AdminSection }) {
  const session = useAdminSession();
  const isMainAdmin = session.status === 'admin';
  const unanswered = useUnansweredCount(isMainAdmin);

  const handleSignOut = async () => {
    try { await signOut(); } catch { window.alert('Could not sign out. Please try again.'); }
  };

  if (session.status === 'unconfigured') return <AdminShell><Notice title="Database not connected"><p>The admin dashboard needs the website database connection before it can load requests.</p></Notice></AdminShell>;
  if (session.status === 'loading') return <AdminShell><p className="text-center text-sm text-navy-700">Checking access...</p></AdminShell>;
  if (session.status === 'signed-out') return <AdminShell><AdminSignIn /></AdminShell>;
  if (session.status === 'error') return <AdminShell><Notice title="Access could not be checked"><p>Something went wrong while checking admin access. Refresh the page to try again.</p></Notice></AdminShell>;
  if (session.status === 'forbidden') return <AdminShell email={session.email} onSignOut={handleSignOut}><Notice title="No admin access"><p>This account is not assigned an administrative role. Ask the main administrator for access.</p></Notice></AdminShell>;

  const isInstitutionAdmin = session.status === 'institution-admin';
  const sections = isInstitutionAdmin ? INSTITUTION_SECTIONS : MAIN_SECTIONS;
  if (!sections.some((item) => item.value === section)) {
    return <AdminShell email={session.email} onSignOut={handleSignOut}><Notice title="Restricted section"><p>Your administrator account can only access operations for its assigned institution.</p><Link to="/admin/orders" className="font-bold text-red-600 hover:underline">Open institution orders</Link></Notice></AdminShell>;
  }

  return (
    <AdminShell email={session.email} onSignOut={handleSignOut}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">{isInstitutionAdmin ? 'Institution administrator' : 'Main administrator'}</p>
          <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{isInstitutionAdmin ? session.institutionName : 'Campus operations'}</h1>
          {isInstitutionAdmin && <p className="text-sm text-navy-600">You are viewing operations for your assigned institution only.</p>}
        </div>
        {isMainAdmin && (
          <Link to="/admin/messages" className="flex items-center justify-between gap-4 rounded-3xl border border-navy-100 bg-white p-5 shadow-sm transition hover:border-red-200 sm:p-6">
            <div className="flex flex-col gap-1"><span className="text-xs font-bold uppercase tracking-wider text-navy-500">Unanswered messages</span><span className="text-sm text-navy-700">Website enquiries waiting for a reply</span></div>
            <span className="text-3xl font-extrabold text-red-500">{unanswered.count ?? '-'}</span>
          </Link>
        )}
        <nav aria-label="Admin menu" tabIndex={0} className="flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-navy-100 bg-white p-2 shadow-sm whitespace-nowrap">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = item.value === section;
            return <Link key={item.value} to={`/admin/${item.value}`} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-700 hover:bg-navy-50 hover:text-navy-900'}`}><Icon className="h-4 w-4" aria-hidden="true" /><span>{item.label}</span>{item.value === 'messages' && unanswered.count !== null && unanswered.count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>{unanswered.count}</span>}</Link>;
          })}
        </nav>
        <SectionContent section={section} onMessagesChanged={unanswered.reload} />
      </div>
    </AdminShell>
  );
}
