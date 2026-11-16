# Dreypella Campus Cash Settlement and Automation Requirements

Status: Approved for development planning; implementation must be validated against the existing order and delivery-partner schema before database changes are made.

## Approved policy
- Dispatch partners remit cash collected from customers twice weekly.
- Settlement days and cut-off times must be configurable by the main administrator. Do not hard-code weekdays until approved.
- Per-order settlement may be required as an exception for new, overdue, high-risk, or over-limit partners.
- Cash collection is not the same as payment reconciliation. A rider's collection entry remains pending until an authorised administrator verifies the remittance.

## Ledger principles
Keep separate immutable ledger entries for:
- Gross cash collected from a customer.
- Vendor/supplier payable.
- Dispatch partner delivery earnings.
- Dreypella service fee/commission.
- Other approved adjustments.
- Partner remittance and reconciliation.

Never treat gross customer collections as Dreypella revenue. The system must calculate each payable from the accepted order quotation and the applicable approved pricing rules.

## Required workflow
1. Customer accepts a versioned quotation showing item/service cost, platform/service fee, delivery charge, and total.
2. Order records the selected permitted payment method: bank transfer or cash.
3. For cash orders assigned to an eligible partner, the assigned partner records the exact amount collected against the assigned order.
4. Collection creates a pending ledger entry; it does not mark a bank transfer as paid and does not settle the partner's liability.
5. The system calculates the partner's net remittance obligation after approved delivery earnings and supplier/vendor amounts are accounted for.
6. Partner submits remittance reference and optional evidence.
7. An authorised finance/main administrator verifies the actual bank credit and reconciles the remittance.
8. The system closes only the verified amount and leaves any shortfall or excess visible.
9. Automated reminders are sent before and after each configured twice-weekly settlement deadline.
10. Overdue or over-limit partners can be paused from new cash-collection assignments, with an auditable reason and authorised override.

## Permissions and controls
- Customers can see their own order payment state and receipt/collection confirmation, never internal partner balances.
- Delivery partners can see only their own collections, remittances, earnings, and outstanding balance.
- Institution administrators can see only permitted financial activity for their institution.
- Main administrators/authorised finance staff can reconcile across institutions.
- No user may approve their own remittance.
- All financial events are append-only or corrected by reversing/adjusting entries; do not silently overwrite history.
- Idempotency keys and database constraints must prevent duplicate collection and remittance records.
- Receipt uploads are evidence only. Screenshots never automatically prove payment.
- All money amounts use integer minor units (kobo) or a rigorously consistent NGN integer representation; never use floating-point arithmetic.

## Pricing engine
- Pricing rules are administrator-configurable by institution, service, delivery zone, and effective date.
- Support fixed fees, rate-based fees, distance/quantity bands, and quotation-required cases.
- A quotation is versioned and immutable once accepted. Changes require a new version and customer re-acceptance.
- Display a transparent breakdown before the customer confirms.
- Do not invent rates where a configured rate is absent; route the order for a manual quotation.
- Keep customer-facing price, vendor payable, partner earning, and Dreypella revenue as distinct values.

## No-gateway initial launch
- Initial payment methods: bank transfer and cash where enabled for the service/order.
- Bank transfer confirmation requires authorised verification against the actual bank account transaction.
- Do not require Paystack, Flutterwave, Monnify, or another paid gateway for initial operation.
- Keep a future provider adapter boundary, but no gateway credentials or billing dependency in the initial release.

## Automation requirements
- Schedule settlement reminders from the configured twice-weekly calendar.
- Generate partner settlement statements and administrator reconciliation queues.
- Alert on missing remittances, partial payments, unusual amounts, duplicate references, and exceeded limits.
- Retry notification delivery safely without duplicating ledger entries.
- Record failed automation jobs for retry and administrator review.

## Implementation gate
Before creating migrations or UI, inspect and map the existing schema for:
- individual and bulk order identifiers and accepted quotation fields;
- delivery partner identity and order assignment relationships;
- existing payment records and order status transitions;
- institution ownership and administrator role checks;
- notification delivery infrastructure and scheduled-job support.

Do not add a parallel ledger or payment model if an existing one can be safely extended. Do not apply migrations to the live Supabase project or deploy production without explicit approval.
