import { ClipboardList, MessageCircle, MousePointerClick, PackageCheck } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Choose a service',
    description: 'Pick Buy, Print, Get or Deliver based on what you need done.',
  },
  {
    icon: ClipboardList,
    title: 'Fill in your details',
    description: 'Describe your items, upload your document name, or add pickup and errand information.',
  },
  {
    icon: MessageCircle,
    title: 'Send on WhatsApp',
    description: 'Add your name, WhatsApp number and delivery spot, review, then send your request.',
  },
  {
    icon: PackageCheck,
    title: 'Receive your quote',
    description: 'We reply on WhatsApp to confirm your quote and get your order to you.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From request to doorstep in four simple steps"
          description="No app to download and no account to create. Everything happens in a few taps and a WhatsApp message."
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-4 md:gap-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-navy-100 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-3xl font-extrabold text-navy-100" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
