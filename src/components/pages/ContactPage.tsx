import Contact from '@/components/sections/Contact';
import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import Button from '@/components/ui/Button';
import { navigate } from '@/lib/navigation';

export default function ContactPage() {
  return (
    <>
      <PageShell>
        <PageIntro eyebrow="Contact us" title="We are a WhatsApp message away">
          <p>Questions about an order, a price or a delivery? Message the Campus team and quote your reference number.</p>
        </PageIntro>
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate('/enquiry')} className="px-5 py-2.5 text-sm">
            Send us a message
          </Button>
        </div>
      </PageShell>
      <Contact onOrder={() => navigate('/order')} />
    </>
  );
}
