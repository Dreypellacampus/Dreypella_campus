# Dreypella Campus payment activation

The development branch now contains a Paystack checkout flow for approved individual-order quotations and a cash-on-delivery selection flow.

## Required before real payments can be accepted

1. Apply the Supabase migrations in timestamp order, including:
   - `20261118000000_order_payments.sql`
   - `20261118010000_admin_cash_payment_confirmation.sql`
2. Deploy the Edge Functions:
   - `order-payments`
   - `paystack-webhook`
3. Configure Supabase Edge Function secrets:
   - `PAYSTACK_SECRET_KEY`: Paystack test secret key for development; use the live secret only after production approval.
   - `SITE_URL`: exact customer-facing site origin, e.g. the development Pages origin for development.
   - Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions.
4. In the Paystack dashboard, register the deployed `paystack-webhook` function URL as the webhook URL.
5. Complete a test transaction and confirm:
   - the browser return verifies the reference, amount and NGN currency;
   - the signed webhook independently confirms the same reference and amount;
   - duplicate webhook delivery does not duplicate or reverse a payment;
   - a cash selection stays `awaiting_cash` until an authorised administrator confirms receipt.

## Current payment rules

- Payment can only be started for an order belonging to the signed-in customer.
- The customer must approve a quotation first.
- Amount is read from the saved quotation on the server; the browser cannot choose the payable amount.
- Paystack secret credentials remain server-side.
- Cash is recorded as `awaiting_cash`; it is not shown as paid until an authorised main or assigned institution administrator confirms receipt.
- Payment records are readable by the owning customer, main administrators and the assigned institution administrator for that order.
- Guest orders cannot use online checkout until linked to a signed-in customer account.

## Not yet activated

No migration has been applied to the Supabase project and no Edge Function has been deployed by this code change. Do not accept live payments until the deployment, secret configuration, webhook registration and end-to-end test are complete. Use Paystack test mode first.
