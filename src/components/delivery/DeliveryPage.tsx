import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Truck, Wallet } from 'lucide-react';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { AssignmentCard, SummaryCard } from '@/components/delivery/DeliveryCards';
import PartnerBankDetails from '@/components/delivery/PartnerBankDetails';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { formatNaira } from '@/lib/format';
import {
  fetchDeliveryPartner,
  fetchPartnerAssignments,
  markOrderDelivered,
  type DeliveryPartner,
  type PartnerAssignment,
} from '@/lib/deliveryPartnerRepository';

type LoadState =
  | { status: 'loading' }
  | { status: 'not-partner' }
  | { status: 'inactive' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: DeliveryPartner; assignments: PartnerAssignment[] };

interface EarningsSummary {
  earned: number;
  pending: number;
  deliveredCount: number;
}

function summarizeEarnings(assignments: PartnerAssignment[]): EarningsSummary {
  return assignments.reduce<EarningsSummary>(
    (totals, assignment) => {
      if (assignment.deliveredAt) {
        totals.earned += assignment.fee;
        totals.deliveredCount += 1;
      } else {
        totals.pending += assignment.fee;
      }
      return totals;
    },
    { earned: 0, pending: 0, deliveredCount: 0 },
  );
}

export default function DeliveryPage() {
  const session = useCustomerSession();
  const userId = session.userId;
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoad({ status: 'loading' });

    (async () => {
      try {
        const partner = await fetchDeliveryPartner(userId);
        if (!active) return;
        if (!partner) {
          setLoad({ status: 'not-partner' });
          return;
        }
        if (!partner.active) {
          setLoad({ status: 'inactive' });
          return;
        }
        const assignments = await fetchPartnerAssignments(partner.id);
        if (active) setLoad({ status: 'ready', partner, assignments });
      } catch (caught) {
        if (active) {
          setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const handleMarkDelivered = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setActionError(null);
    try {
      await markOrderDelivered(orderId);
      setConfirmOrderId(null);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'The order could not be updated.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!userId || load.status === 'loading') {
    return (
      <PageShell>
        <p className="text-center text-sm text-navy-700">Loading your deliveries...</p>
      </PageShell>
    );
  }

  if (load.status === 'not-partner' || load.status === 'inactive') {
    return (
      <PageShell>
        <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-navy-200 bg-white p-6 sm:p-8">
          <p className="text-base font-bold text-navy-900">
            {load.status === 'inactive' ? 'Your delivery partner access is paused.' : 'This account is not a delivery partner.'}
          </p>
          <p className="text-sm leading-relaxed text-navy-700">
            Contact the Dreypella team if you think this is a mistake.
          </p>
        </div>
      </PageShell>
    );
  }

  if (load.status === 'error') {
    return (
      <PageShell>
        <p role="alert" className="text-sm font-semibold text-red-600">
          Your deliveries could not be loaded. {load.message}
        </p>
      </PageShell>
    );
  }

  const { partner, assignments } = load;
  const summary = summarizeEarnings(assignments);
  const openAssignments = assignments.filter((assignment) => assignment.deliveredAt === null);
  const completedAssignments = assignments.filter((assignment) => assignment.deliveredAt !== null);

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
            <Truck className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">Delivery partner</p>
          <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Hello, {partner.full_name}</h1>
          <p className="text-sm leading-relaxed text-navy-700">
            Your assigned deliveries are below. Mark an order as delivered once the customer has received it.
          </p>
        </div>

        <PartnerBankDetails partner={partner} />

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={Wallet} label="Earned" value={formatNaira(summary.earned)} tone="emerald" />
          <SummaryCard icon={Clock} label="Pending payout" value={formatNaira(summary.pending)} tone="amber" />
          <SummaryCard icon={CheckCircle2} label="Deliveries completed" value={String(summary.deliveredCount)} tone="navy" />
        </div>

        {actionError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {actionError}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-navy-900">Open deliveries ({openAssignments.length})</h2>
          {openAssignments.length === 0 && (
            <p className="rounded-3xl border border-dashed border-navy-200 bg-white p-6 text-sm text-navy-700">
              No open deliveries right now.
            </p>
          )}
          <ul className="flex flex-col gap-4">
            {openAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.orderId}
                assignment={assignment}
                updating={updatingOrderId === assignment.orderId}
                confirming={confirmOrderId === assignment.orderId}
                onRequestConfirm={() => setConfirmOrderId(assignment.orderId)}
                onCancelConfirm={() => setConfirmOrderId(null)}
                onConfirm={() => handleMarkDelivered(assignment.orderId)}
              />
            ))}
          </ul>
        </section>

        {completedAssignments.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-extrabold text-navy-900">Completed ({completedAssignments.length})</h2>
            <ul className="flex flex-col gap-4">
              {completedAssignments.map((assignment) => (
                <AssignmentCard key={assignment.orderId} assignment={assignment} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  );
}
