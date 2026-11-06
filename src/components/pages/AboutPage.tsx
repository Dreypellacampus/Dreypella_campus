import PageIntro from '@/components/pages/PageIntro';
import WhyChoose from '@/components/sections/WhyChoose';
import { PageShell } from '@/components/account/SignedOutPrompt';

export default function AboutPage() {
  return (
    <>
      <PageShell>
        <PageIntro eyebrow="About us" title="Built for students, run from Ogbomoso">
          <p>
            Dreypella Campus is a student errand service for LAUTECH students. We buy, print, collect and deliver the
            things you need, so you can spend your time on your studies instead of queues and trips across town.
          </p>
        </PageIntro>
      </PageShell>
      <WhyChoose />
    </>
  );
}
