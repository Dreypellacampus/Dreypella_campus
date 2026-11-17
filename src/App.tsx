import { useState, type ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequireCustomer from '@/components/layout/RequireCustomer';
import AdminPage, { type AdminSection } from '@/components/admin/AdminPage';
import BulkOrderFlow from '@/components/bulk/BulkOrderFlow';
import DeliveryPage from '@/components/delivery/DeliveryPage';
import ResetPasswordDialog from '@/components/account/ResetPasswordDialog';
import CustomerLayout from '@/components/layout/CustomerLayout';
import ProfilePage from '@/components/account/ProfilePage';
import MyOrdersPage from '@/components/orders/MyOrdersPage';
import QuotationsPage from '@/components/orders/QuotationsPage';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import AboutPage from '@/components/pages/AboutPage';
import AuthPage from '@/components/pages/AuthPage';
import ContactPage from '@/components/pages/ContactPage';
import DashboardPage from '@/components/pages/DashboardPage';
import EnquiryPage from '@/components/pages/EnquiryPage';
import HomePage from '@/components/pages/HomePage';
import HowItWorksPage from '@/components/pages/HowItWorksPage';
import LegalPage from '@/components/pages/LegalPage';
import NotFoundPage from '@/components/pages/NotFoundPage';
import OrderPage from '@/components/pages/OrderPage';
import SavedAddressesPage from '@/components/pages/SavedAddressesPage';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useLocation } from '@/hooks/useLocation';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from '@/data/legal';
import { SERVICE_LIST } from '@/data/services';
import { navigate } from '@/lib/navigation';

const ADMIN_PAGES: Record<string, AdminSection> = {
  '/admin': 'bulk-requests',
  '/admin/bulk-requests': 'bulk-requests',
  '/admin/orders': 'orders',
  '/admin/customers': 'customers',
  '/admin/services': 'services',
  '/admin/pricing': 'pricing',
  '/admin/locations': 'locations',
  '/admin/partners': 'partners',
  '/admin/partner-finances': 'partner-finances',
  '/admin/finance-accounting': 'finance-accounting',
  '/admin/institutions': 'institutions',
  '/admin/payment-settings': 'payment-settings',
  '/admin/messages': 'messages',
};

const toDashboard = () => navigate('/dashboard');

const CUSTOMER_LAYOUT_PATHS = new Set([
  '/dashboard',
  '/order',
  '/bulk-orders',
  '/my-orders',
  '/quotations',
  '/notifications',
  '/profile',
  '/addresses',
  '/delivery',
]);

function renderPage(pathname: string): ReactNode {
  const adminSection = ADMIN_PAGES[pathname];
  if (adminSection) return <AdminPage section={adminSection} />;

  const serviceId = SERVICE_LIST.map((service) => service.id).find((id) => pathname === `/services/${id}`);
  if (serviceId) return <RequireCustomer><OrderPage initialService={serviceId} /></RequireCustomer>;

  switch (pathname) {
    case '/':
      return <HomePage />;
    case '/about':
      return <AboutPage />;
    case '/how-it-works':
      return <HowItWorksPage />;
    case '/contact':
      return <ContactPage />;
    case '/enquiry':
      return <EnquiryPage />;
    case '/privacy':
      return <LegalPage document={PRIVACY_POLICY} />;
    case '/terms':
      return <LegalPage document={TERMS_AND_CONDITIONS} />;
    case '/login':
      return <AuthPage mode="signin" />;
    case '/signup':
      return <AuthPage mode="signup" />;
    case '/dashboard':
      return <RequireCustomer><DashboardPage /></RequireCustomer>;
    case '/order':
      return <RequireCustomer><OrderPage initialService={null} /></RequireCustomer>;
    case '/bulk-orders':
      return <RequireCustomer><BulkOrderFlow onBack={toDashboard} onClose={toDashboard} /></RequireCustomer>;
    case '/my-orders':
      return <RequireCustomer><MyOrdersPage /></RequireCustomer>;
    case '/quotations':
      return <RequireCustomer><QuotationsPage /></RequireCustomer>;
    case '/notifications':
      return <RequireCustomer><NotificationsPage /></RequireCustomer>;
    case '/profile':
      return <RequireCustomer><ProfilePage /></RequireCustomer>;
    case '/addresses':
      return <RequireCustomer><SavedAddressesPage /></RequireCustomer>;
    case '/delivery':
      return <RequireCustomer><DeliveryPage /></RequireCustomer>;
    default:
      return <NotFoundPage />;
  }
}

export default function App() {
  const location = useLocation();
  const pathname = location.split('?')[0];
  const session = useCustomerSession();
  const [resetDone, setResetDone] = useState(false);

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return renderPage(pathname);
  }

  const showReset = session.recovering && !resetDone;

  if (CUSTOMER_LAYOUT_PATHS.has(pathname)) {
    return (
      <>
        <CustomerLayout pathname={pathname}>{renderPage(pathname)}</CustomerLayout>
        {showReset && <ResetPasswordDialog onDone={() => setResetDone(true)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>{renderPage(pathname)}</main>
      <Footer />
      {showReset && <ResetPasswordDialog onDone={() => setResetDone(true)} />}
    </div>
  );
}
