import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button, { buttonStyles } from '@/components/ui/Button';
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY_NUMBER } from '@/lib/whatsapp';

interface ContactProps {
  onOrder: () => void;
}

export default function Contact({ onOrder }: ContactProps) {
  return (
    <section id="contact" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-navy-900 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <SectionHeader
              eyebrow="Contact us"
              title="Talk to us on WhatsApp"
              description="Have a question or a special request? Send us a message and a real person from the Dreypella team will reply."
              align="left"
              tone="dark"
            />
            <div className="mt-8 flex flex-col gap-4 text-navy-100 sm:flex-row sm:gap-8">
              <p className="flex items-center gap-2 text-base font-semibold text-white">
                <Phone className="h-5 w-5 text-red-400" aria-hidden="true" />
                {WHATSAPP_DISPLAY_NUMBER}
              </p>
              <p className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-red-400" aria-hidden="true" />
                <a href="mailto:dreypellaride@gmail.com" className="hover:underline">
                  dreypellaride@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-red-400" aria-hidden="true" />
                Opposite Dr. Oyewo House under G, Ogbomoso
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 sm:p-8">
            <p className="text-lg font-extrabold text-navy-900">Ready to get something done?</p>
            <p className="text-sm leading-relaxed text-navy-700">
              Place your order in a few taps, or message us directly if you want to ask something first.
            </p>
            <Button onClick={onOrder} className="w-full">
              ORDER NOW
            </Button>
            <a
              href={WHATSAPP_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles('outline', 'w-full')}
            >
              <MessageCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
