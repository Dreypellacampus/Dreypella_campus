import { getSupabase } from '@/lib/supabase';

export interface OrderPayment {
  id: string;
  order_id: string;
  method: 'paystack' | 'cash';
  status: 'pending' | 'successful' | 'failed' | 'awaiting_cash';
  amount_kobo: number;
  currency: 'NGN';
  reference: string;
  paid_at: string | null;
  created_at: string;
}

async function invoke<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke('order-payments', { body });
  if (error) throw new Error(data?.error || error.message || 'Payment request failed.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function startOnlinePayment(orderId: string): Promise<{ authorization_url: string; reference: string }> {
  return invoke({ action: 'initialize', order_id: orderId });
}

export async function chooseCashPayment(orderId: string): Promise<{ status: 'awaiting_cash'; reference: string }> {
  return invoke({ action: 'cash', order_id: orderId });
}

export async function verifyOnlinePayment(reference: string): Promise<{ status: 'successful' | 'pending'; message?: string }> {
  return invoke({ action: 'verify', reference });
}

export async function fetchOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const { data, error } = await getSupabase()
    .from('order_payments')
    .select('id, order_id, method, status, amount_kobo, currency, reference, paid_at, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Payment status could not be loaded.');
  return (data ?? []) as OrderPayment[];
}

export async function confirmCashPayment(paymentId: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_confirm_cash_order_payment', { p_payment_id: paymentId });
  if (error) throw new Error(error.message || 'Cash payment could not be confirmed.');
}
