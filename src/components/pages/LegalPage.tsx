import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import type { LegalDocument } from '@/data/legal';

interface LegalPageProps {
  document: LegalDocument;
}

export default function LegalPage({ document }: LegalPageProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-12">
        <PageIntro eyebrow="Legal" title={document.title}>
          <p className="text-sm text-navy-600">Last updated: {document.updated}</p>
        </PageIntro>
        {document.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-xl font-extrabold text-navy-900">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-navy-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
