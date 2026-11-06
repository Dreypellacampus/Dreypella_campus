import Button from '@/components/ui/Button';
import Hero from '@/components/sections/Hero';
import Pricing from '@/components/sections/Pricing';
import Faq from '@/components/sections/Faq';
import Services from '@/components/sections/Services';
import { navigate } from '@/lib/navigation';
import type { ServiceId } from '@/data/services';

export default function HomePage() {
  const startService = (service: ServiceId) => navigate(`/services/${service}`);

  return (
    <>
      <Hero onOrder={() => navigate('/order')} />
      <Services onOrderService={startService} />
      <Pricing onOrderService={startService} />
      <Faq />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 pb-20 text-center sm:px-6 lg:px-8">
        <p className="text-base font-semibold text-navy-800">Ready to order? Create an account or sign in first.</p>
        <Button onClick={() => navigate('/order')} className="px-6 py-3 text-sm">
          Order now
        </Button>
      </div>
    </>
  );
}
