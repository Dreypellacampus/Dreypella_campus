# Dreypella Campus manual payment process

Dreypella Campus uses manual payment and administrator confirmation. No payment gateway is integrated.

## Customer process

1. The customer submits an order and receives a quotation.
2. After approving the quotation, the customer sees the official bank details configured by the main administrator.
3. The customer transfers the exact quoted amount .
4. For a bank transfer, the customer submits the sender name, sender bank (optional), transfer reference/narration and any note.
5. The payment is marked `awaiting_confirmation`. A submitted transfer reference is not proof that funds have arrived.
6. The customer waits while an authorised administrator checks the receiving bank account or confirms .

## Administrator process

- Main administrators configure bank name, account name, account number and customer instructions at `/admin/payment-settings`.
- Main administrators and the assigned institution administrator can review payment submissions on the individual order detail screen.
- The administrator must independently verify cleared funds in the receiving account or physically receive bank transfer.
- The administrator selects **Confirm received** or **Reject submission**, optionally adding a note.
- Only an authorised administrator can change a submission to `confirmed` or `rejected`.
- Customers can see the resulting status and administrator note.

## Database and security

The migration `20261118000000_order_payments.sql` creates the manual payment records and payment-settings table. It also adds two restricted database functions:
- `submit_manual_order_payment`: creates a payment submission for the signed-in owner of an order using the approved quotation amount from the database.
- `review_manual_order_payment`: allows only a main administrator or the active institution administrator assigned to that order to confirm or reject a pending submission.

Customers can read only their own payment records. Payment settings are readable by signed-in customers; only main administrators can update the account details.

## Activation checklist

1. Review and approve the migration before applying it to the development Supabase project.
2. Apply the migration to development, then test customer submission, institution-admin review, main-admin review, and customer status visibility using test accounts.
3. Enter the official bank details in `/admin/payment-settings`.
4. Do not apply the migration to production until explicitly approved and tested.

No payment gateway secrets, checkout URLs, webhook, or automated payment verification are required. The app does not automatically mark any customer payment as received.
