import PageIntro from '@/components/pages/PageIntro';
import HowItWorks from '@/components/sections/HowItWorks';
import Button from '@/components/ui/Button';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { navigate } from '@/lib/navigation';

export default function HowItWorksPage() {
  return (
    <>
      <PageShell>
        <PageIntro eyebrow="How it works" title="From request to delivery in four steps">
          <p>Create an account, choose a service, tell us what you need, and we handle the rest on WhatsApp.</p>
        </PageIntro>
      </PageShell>
      <HowItWorks />
      <div className="mx-auto flex max-w-6xl justify-center px-4 pb-20 sm:px-6 lg:px-8">
        <Button onClick={() => navigate('/order')} className="px-6 py-3 text-sm">
          Start an order
        </Button>
      </div>
    </>
  );
}
