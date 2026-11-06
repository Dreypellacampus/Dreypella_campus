import OrderModal from '@/components/order/OrderModal';
import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import type { ServiceId } from '@/data/services';
import { navigate } from '@/lib/navigation';

interface OrderPageProps {
  initialService: ServiceId | null;
}

export default function OrderPage({ initialService }: OrderPageProps) {
  const close = () => navigate('/dashboard');

  return (
    <>
      <PageShell>
        <PageIntro eyebrow="Place an order" title="Tell us what you need" />
      </PageShell>
      <OrderModal initialService={initialService} onClose={close} />
    </>
  );
}
