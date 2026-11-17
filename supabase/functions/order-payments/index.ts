import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!supabaseUrl || !anonKey || !serviceKey || !paystackKey || !siteUrl) {
    return json({ error: "Payment service is not configured yet." }, 503);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in to continue." }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user?.email) return json({ error: "Your signed-in account could not be verified." }, 401);

  try {
    const body = await req.json();
    const action = body?.action;
    const orderId = typeof body?.order_id === "string" ? body.order_id : "";
    if (action === "initialize" || action === "cash") {
      if (!orderId) return json({ error: "Order reference is missing." }, 400);
      const { data: order } = await admin.from("individual_orders").select("id,user_id").eq("id", orderId).eq("user_id", authData.user.id).maybeSingle();
      if (!order) return json({ error: "This order does not belong to your account." }, 404);
      const { data: quote } = await admin.from("quotations").select("amount,status").eq("order_id", orderId).maybeSingle();
      if (!quote || quote.status !== "Approved" || !Number.isFinite(Number(quote.amount)) || Number(quote.amount) <= 0) {
        return json({ error: "Approve a valid quotation before making payment." }, 409);
      }
      const amountKobo = Math.round(Number(quote.amount) * 100);
      const reference = `DPC-${crypto.randomUUID()}`;
      const method = action === "cash" ? "cash" : "paystack";
      const status = action === "cash" ? "awaiting_cash" : "pending";
      const { error: insertError } = await admin.from("order_payments").insert({
        order_id: orderId, user_id: authData.user.id, method, status,
        amount_kobo: amountKobo, currency: "NGN", reference,
      });
      if (insertError) throw insertError;
      if (action === "cash") return json({ status: "awaiting_cash", reference });

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authData.user.email,
          amount: amountKobo,
          reference,
          callback_url: `${siteUrl.replace(/\/$/, "")}/my-orders?payment_reference=${encodeURIComponent(reference)}`,
          metadata: { order_id: orderId, user_id: authData.user.id },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.status || !result.data?.authorization_url) {
        await admin.from("order_payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("reference", reference);
        return json({ error: result.message || "Paystack could not start checkout." }, 502);
      }
      await admin.from("order_payments").update({ provider_reference: String(result.data.reference), updated_at: new Date().toISOString() }).eq("reference", reference);
      return json({ authorization_url: result.data.authorization_url, reference });
    }

    if (action === "verify") {
      const reference = typeof body?.reference === "string" ? body.reference : "";
      if (!reference) return json({ error: "Payment reference is missing." }, 400);
      const { data: payment } = await admin.from("order_payments").select("*").eq("reference", reference).eq("user_id", authData.user.id).maybeSingle();
      if (!payment || payment.method !== "paystack") return json({ error: "Payment record was not found." }, 404);
      if (payment.status === "successful") return json({ status: "successful" });
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const result = await response.json();
      const verified = response.ok && result.status && result.data?.status === "success"
        && Number(result.data.amount) === Number(payment.amount_kobo)
        && result.data.currency === "NGN"
        && String(result.data.reference) === reference;
      if (!verified) {
        if (response.ok && result.data?.status === "failed") {
          await admin.from("order_payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.id);
        }
        return json({ status: "pending", message: "Payment has not yet been confirmed. You can refresh this page shortly." }, 202);
      }
      const { error: updateError } = await admin.from("order_payments").update({
        status: "successful", paid_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        provider_reference: String(result.data.id),
      }).eq("id", payment.id);
      if (updateError) throw updateError;
      return json({ status: "successful" });
    }
    return json({ error: "Unknown payment action." }, 400);
  } catch (error) {
    console.error("order-payments error", error);
    return json({ error: "Payment request could not be completed. Please try again." }, 500);
  }
});
