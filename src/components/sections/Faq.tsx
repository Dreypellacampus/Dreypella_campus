import { ChevronDown } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const FAQS = [
  {
    question: 'How do I place an order?',
    answer:
      'Choose a service, fill in the order details, add your name, WhatsApp number and delivery location, review everything, then send it to us on WhatsApp.',
  },
  {
    question: 'How do I know how much it will cost?',
    answer:
      'Prices are not fixed on the website. Every request is quoted for your specific items or task, and we confirm the quote with you on WhatsApp.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'We deliver to student hostels and approved locations around the LAUTECH campus in Ogbomoso. Tell us your exact spot and we will confirm it is covered.',
  },
  {
    question: 'How do I send my document for printing?',
    answer:
      'Select your document in the Print for Me form so we know its name. After you submit, send the actual file in the WhatsApp chat so we can print it.',
  },
  {
    question: 'How do I pay?',
    answer:
      'Payment details are confirmed with you on WhatsApp once your quote is agreed, so you always know how and what you are paying.',
  },
  {
    question: 'Can I change my order after sending it?',
    answer:
      'Yes. Message us on WhatsApp at 07039172886 as soon as possible and we will update your request.',
  },
];

export default function Faq() {
  return (
    <section id="faq" className="bg-mist py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-8">
        <div>
          <SectionHeader
            eyebrow="FAQs"
            title="Questions students ask us"
            description="Cannot find what you need? Chat with us directly on WhatsApp."
            align="left"
          />
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-navy-100 bg-white p-5 transition open:shadow-md open:shadow-navy-900/5 sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-navy-900 marker:content-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-red-500 transition duration-300 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-navy-700 sm:text-base">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
