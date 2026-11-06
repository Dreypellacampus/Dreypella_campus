import { useEffect, useState } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import PageIntro from '@/components/pages/PageIntro';
import NotificationItem from '@/components/notifications/NotificationItem';
import Link from '@/components/layout/Link';
import Button from '@/components/ui/Button';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { fetchCustomerProfile } from '@/lib/customerProfileRepository';
import { fetchIndividualOrders, type IndividualOrderRow } from '@/lib/individualOrderRepository';
import { fetchNotifications, type NotificationRow } from '@/lib/notificationRepository';
import { navigate } from '@/lib/navigation';
import { STATUS_STYLES } from '@/components/admin/statusStyles';

export default function DashboardPage() {
  const session = useCustomerSession();
  const [name, setName] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [institution, setInstitution] = useState<string | null>(null);
  const [orders, setOrders] = useState<IndividualOrderRow[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userId = session.userId;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([fetchCustomerProfile(userId), fetchIndividualOrders(), fetchNotifications()])
      .then(([profile, nextOrders, items]) => {
        if (!active) return;
        setName(profile?.full_name ?? null);
        setCategory(profile?.customer_category ?? null);
        setInstitution(profile?.institution ?? null);
        setOrders(nextOrders);
        setNotifications(items);
      })
      .catch(() => {
        if (active) setLoadError('We could not load your details right now. Refresh the page to try again.');
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const greeting = name ? `Welcome back, ${name.split(' ')[0]}` : 'Welcome back';
  const countWhere = (statuses: string[]) => orders?.filter((order) => statuses.includes(order.status)).length ?? 0;
  const stats = [
    { label: 'Total orders', value: orders?.length ?? 0 },
    { label: 'Pending', value: countWhere(['Pending', 'Under Review', 'Quoted', 'Awaiting Customer Approval']) },
    { label: 'Processing', value: countWhere(['Accepted', 'Processing', 'Ready for Delivery', 'Out for Delivery']) },
    { label: 'Completed', value: countWhere(['Delivered']) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <PageIntro eyebrow="Your dashboard" title={greeting}>
          <p>{session.email}</p>
          {category && (
            <p className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-navy-700">
              <span className="rounded-full bg-navy-100 px-3 py-1 text-navy-800">{category}</span>
              {institution && <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">{institution}</span>}
            </p>
          )}
        </PageIntro>
        <Button onClick={() => navigate('/order')} className="px-6 py-3 text-sm">
          <Package className="h-4 w-4" aria-hidden="true" />
          Place an order
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {loadError}
        </p>
      )}

      <section aria-label="Order summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-600">{stat.label}</span>
            <span className="text-3xl font-extrabold text-navy-900">{orders === null ? '-' : stat.value}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-xl font-extrabold text-navy-900">
              Recent orders
            </h2>
            <Link to="/my-orders" className="text-sm font-bold text-red-600 hover:underline">
              View all
            </Link>
          </div>
          {orders === null && !loadError && <p className="text-sm text-navy-700">Loading your orders...</p>}
          {orders?.length === 0 && <p className="text-sm text-navy-700">You have not placed any orders yet.</p>}
          {orders?.slice(0, 3).map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-navy-900">{order.service_title}</p>
                <p className="text-xs text-navy-600">Reference {order.reference}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>
                {order.status}
              </span>
            </div>
          ))}
        </section>

        <section aria-labelledby="notifications-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="notifications-heading" className="text-xl font-extrabold text-navy-900">
              Recent notifications
            </h2>
            <Link to="/notifications" className="text-sm font-bold text-red-600 hover:underline">
              View all
            </Link>
          </div>
          {notifications === null && !loadError && <p className="text-sm text-navy-700">Loading your updates...</p>}
          {notifications?.length === 0 && <p className="text-sm text-navy-700">No updates yet.</p>}
          {notifications && notifications.length > 0 && (
            <ul className="flex flex-col gap-3">
              {notifications.slice(0, 3).map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <Link to="/order" className="group flex items-center justify-between rounded-3xl bg-navy-900 p-6 text-white shadow-lg sm:p-8">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-extrabold">Need something delivered or bought?</span>
          <span className="text-sm text-white/80">Choose a service and tell us what you need.</span>
        </span>
        <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}
