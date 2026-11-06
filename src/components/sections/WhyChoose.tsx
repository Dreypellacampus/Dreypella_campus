import { BadgeCheck, MapPin, MessageCircle, Zap } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const REASONS = [
  {
    icon: MapPin,
    title: 'Built around LAUTECH',
    description: 'We know the hostels, gates and everyday spots students actually use in Ogbomoso.',
  },
  {
    icon: MessageCircle,
    title: 'Simple WhatsApp ordering',
    description: 'No app to install. Your full request is ready to send in one tap.',
  },
  {
    icon: Zap,
    title: 'Saves your time',
    description: 'Skip the long walks, queues and crowded shops. Your errands get done while you study.',
  },
  {
    icon: BadgeCheck,
    title: 'Clear, honest quotes',
    description: 'Every price is quoted to you for your specific request before you commit.',
  },
];

const WHY_IMAGE =
  'https://images.pexels.com/photos/5538000/pexels-photo-5538000.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function WhyChoose() {
  return (
    <section id="why-dreypella" className="bg-navy-900 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Why choose Dreypella"
            title="Built for how students really live"
            description="Dreypella Campus is made for busy students who would rather spend their energy on lectures, not on errands."
            align="left"
            tone="dark"
          />

          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {REASONS.map((reason) => (
              <li
                key={reason.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white">
                  <reason.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">{reason.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block">
          <img
            src={WHY_IMAGE}
            alt="Students smiling and chatting while carrying notebooks on campus"
            width={940}
            height={650}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl shadow-black/30"
          />
        </div>
      </div>
    </section>
  );
}
