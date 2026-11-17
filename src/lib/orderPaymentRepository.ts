import { getSupabase } from '@/lib/supabase';

export interface OrderPayment {
  id: string;
  order_id: string;
  method: 'bank_transfer' | 'cash';
  status: 'awaiting_confirmation' | 'confirmed' | 'rejected';
  amount_kobo: number;
  currency: 'NGN';
  reference: string;
  sender_name: string | null;
  sender_bank: string | null;
  transfer_reference: string | null;
  customer_note: string | null;
  admin_note: string | null;
  paid_at: string | null;
  created_at: string;
}
export interface CampusPaymentSettings {
  id: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  payment_instructions: string;
}
export async function fetchCampusPaymentSettings(): Promise<CampusPaymentSettings> {
  const { data, error } = await getSupabase().from('campus_payment_settings')
    .select('id,bank_name,account_name,account_number,payment_instructions').eq('id', true).maybeSingle();
  if (error) throw new Error('Payment instructions could not be loaded.');
  return (data ?? { id: true, bank_name: '', account_name: '', account_number: '', payment_instructions: '' }) as CampusPaymentSettings;
}
export async function saveCampusPaymentSettings(values: Omit<CampusPaymentSettings, 'id'>): Promise<void> {
  const { data: auth } = await getSupabase().auth.getUser();
  const { error } = await getSupabase().from('campus_payment_settings').update({
    ...values, updated_at: new Date().toISOString(), updated_by: auth.user?.id ?? null,
  }).eq('id', true);
  if (error) throw new Error(error.message || 'Payment instructions could not be saved.');
}
export async function submitManualOrderPayment(input: {
  orderId: string; method: 'bank_transfer' | 'cash'; senderName?: string; senderBank?: string;
  transferReference?: string; customerNote?: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc('submit_manual_order_payment', {
    p_order_id: input.orderId, p_method: input.method,
    p_sender_name: input.senderName ?? null, p_sender_bank: input.senderBank ?? null,
    p_transfer_reference: input.transferReference ?? null, p_customer_note: input.customerNote ?? null,
  });
  if (error) throw new Error(error.message || 'Payment submission could not be saved.');
  return data as string;
}
export async function fetchOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const { data, error } = await getSupabase().from('order_payments')
    .select('id,order_id,method,status,amount_kobo,currency,reference,sender_name,sender_bank,transfer_reference,customer_note,admin_note,paid_at,created_at')
    .eq('order_id', orderId).order('created_at', { ascending: false });
  if (error) throw new Error('Payment status could not be loaded.');
  return (data ?? []) as OrderPayment[];
}
export async function reviewManualPayment(paymentId: string, decision: 'confirmed' | 'rejected', note?: string): Promise<void> {
  const { error } = await getSupabase().rpc('review_manual_order_payment', {
    p_payment_id: paymentId, p_decision: decision, p_admin_note: note ?? null,
  });
  if (error) throw new Error(error.message || 'Payment review could not be saved.');
}
