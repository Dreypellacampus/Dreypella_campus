import { getSupabase } from '@/lib/supabase';

export const QUOTATION_STATUSES = ['Sent', 'Approved', 'Declined', 'Clarification requested'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export type CustomerQuotationDecision = Exclude<QuotationStatus, 'Sent'>;

export interface Quotation {
  id: string;
  order_id: string;
  amount: number;
  summary: string;
  status: QuotationStatus;
  customer_message: string;
  updated_at: string;
}

export interface QuotationInput {
  orderId: string;
  amount: number;
  summary: string;
}

function isQuotationRow(value: unknown): value is Quotation {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.order_id === 'string' &&
    typeof row.amount === 'number' &&
    typeof row.summary === 'string' &&
    typeof row.customer_message === 'string' &&
    typeof row.updated_at === 'string' &&
    QUOTATION_STATUSES.includes(row.status as QuotationStatus)
  );
}

export async function fetchQuotations(): Promise<Quotation[]> {
  const { data, error } = await getSupabase()
    .from('quotations')
    .select('id, order_id, amount, summary, status, customer_message, updated_at');

  if (error || !Array.isArray(data) || !data.every(isQuotationRow)) {
    throw new Error('Quotations could not be loaded.');
  }
  return data;
}

export async function saveQuotation({ orderId, amount, summary }: QuotationInput): Promise<void> {
  const { data, error } = await getSupabase()
    .from('quotations')
    .upsert(
      {
        order_id: orderId,
        amount,
        summary: summary.trim(),
        status: 'Sent',
        customer_message: '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'order_id' },
    )
    .select('id');

  if (error || !data || data.length === 0) throw new Error('Quotation could not be saved.');
}

export async function respondToQuotation(
  orderId: string,
  decision: CustomerQuotationDecision,
  message: string,
): Promise<void> {
  const { error } = await getSupabase().rpc('respond_to_quotation', {
    p_order_id: orderId,
    p_decision: decision,
    p_message: message,
  });

  if (error) throw new Error(error.message || 'Your response could not be sent.');
}
