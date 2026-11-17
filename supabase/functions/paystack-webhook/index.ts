import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !url || !serviceKey) return new Response("Webhook is not configured", { status: 503 });

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new Response("Missing signature", { status: 401 });

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  if (toHex(digest) !== signature.toLowerCase()) return new Response("Invalid signature", { status: 401 });

  try {
    const event = JSON.parse(rawBody);
    if (event?.event !== "charge.success") return new Response("Event ignored", { status: 200 });
    const data = event.data;
    const reference = typeof data?.reference === "string" ? data.reference : "";
    const amount = Number(data?.amount);
    if (!reference || !Number.isSafeInteger(amount) || data?.currency !== "NGN") {
      return new Response("Invalid payment payload", { status: 400 });
    }

    const admin = createClient(url, serviceKey);
    const { data: payment, error } = await admin.from("order_payments")
      .select("id,amount_kobo,status,method")
      .eq("reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (!payment || payment.method !== "paystack" || Number(payment.amount_kobo) !== amount) {
      return new Response("Payment record mismatch", { status: 400 });
    }
    if (payment.status === "successful") return new Response("Already processed", { status: 200 });

    const { error: updateError } = await admin.from("order_payments").update({
      status: "successful", paid_at: new Date().toISOString(),
      provider_reference: String(data.id), updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    if (updateError) throw updateError;
    return new Response("Payment confirmed", { status: 200 });
  } catch (error) {
    console.error("paystack-webhook error", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
