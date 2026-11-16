import PageIntro from '@/components/pages/PageIntro';
import WhyChoose from '@/components/sections/WhyChoose';
import { PageShell } from '@/components/account/SignedOutPrompt';

export default function AboutPage() {
  return (
    <>
      <PageShell>
        <PageIntro eyebrow="About us" title="Built for students across institutions">
          <p>
            Dreypella Campus is a student convenience and errand platform designed to help students
            access shopping, printing, collection errands and delivery with less stress. We are
            building to serve students across participating institutions and to expand into more
            communities and locations over time.
          </p>
        </PageIntro>
      </PageShell>
      <WhyChoose />
    </>
  );
}
