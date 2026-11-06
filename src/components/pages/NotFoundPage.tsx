import Button from '@/components/ui/Button';
import PageIntro from '@/components/pages/PageIntro';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { navigate } from '@/lib/navigation';

export default function NotFoundPage() {
  return (
    <PageShell>
      <div className="flex flex-col items-start gap-6">
        <PageIntro eyebrow="Page not found" title="This page does not exist" />
        <Button onClick={() => navigate('/')} className="px-6 py-3 text-sm">
          Back to the home page
        </Button>
      </div>
    </PageShell>
  );
}
