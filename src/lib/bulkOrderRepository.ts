import { getSupabase } from '@/lib/supabase';
import type { BulkOrderPayload, BulkOrderRecord, BulkOrderRow, BulkStatus } from '@/lib/bulkOrder';

export async function saveBulkOrder(
  payload: BulkOrderPayload,
  reference: string
): Promise<BulkOrderRecord> {
  const record: BulkOrderRecord = { ...payload, reference };
  const { error } = await getSupabase().from('bulk_orders').insert(record);
  if (error) throw new Error('Bulk order could not be saved.');
  return record;
}

export async function fetchBulkOrders(): Promise<BulkOrderRow[]> {
  const { data, error } = await getSupabase()
    .from('bulk_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Bulk orders could not be loaded.');
  return (data ?? []) as BulkOrderRow[];
}

export interface BulkOrderUpdate {
  status: BulkStatus;
  internal_notes: string | null;
  customer_response: string | null;
}

export async function updateBulkOrder(id: string, update: BulkOrderUpdate): Promise<void> {
  const { error } = await getSupabase()
    .from('bulk_orders')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error('Changes could not be saved.');
}
