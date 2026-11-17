# Dreypella Campus manual bank-transfer payments

Dreypella Campus accepts bank transfers only. There is no cash payment option and no payment gateway integration.

## Customer process

1. Submit an order and receive a quotation.
2. Approve the quotation.
3. View the official bank details configured by the main administrator.
4. Transfer the exact quoted amount.
5. Submit the sender name, sender bank (optional), transfer reference/narration and an optional note.
6. Wait for an authorised administrator to verify that the funds have cleared into the receiving account.

A submitted transfer reference is not proof that funds have arrived. A payment remains `awaiting_confirmation` until manually reviewed.

## Administrator process

- The main administrator configures bank name, account name, account number and customer instructions at `/admin/payment-settings`.
- Main administrators and the active institution administrator assigned to the order can review payment submissions.
- The administrator independently checks the receiving bank account and confirms cleared funds.
- The administrator selects **Confirm received** or **Reject submission**, optionally adding a note.
- Only an authorised administrator can change a submission to `confirmed` or `rejected`.

## Security and database

The migration `20261118000000_order_payments.sql` creates manual bank-transfer records and payment settings. The database accepts only `bank_transfer`; cash submissions are rejected. The submission function derives the amount from the customer's approved quotation rather than trusting an amount supplied by the browser. The review function restricts confirmation to the main administrator or active institution administrator assigned to the order.

Customers can read only their own payment records. Payment settings are readable by signed-in customers; only main administrators can update bank details.

## Activation checklist

1. Review and approve the migration before applying it to the development Supabase project.
2. Apply it to development and test customer submission, institution-admin review, main-admin review and customer status visibility using test accounts.
3. Enter the official bank details in `/admin/payment-settings`.
4. Do not apply the migration to production until explicitly approved and tested.

No payment gateway secrets, checkout URLs, webhook or automatic payment verification are required. The app never marks a transfer as received automatically.
