import { getSupabase } from '@/lib/supabase';
import type { BulkStatus } from '@/lib/bulkOrder';
import type { DeliveryLocation } from '@/lib/deliveryLocation';

export interface IndividualOrderRecord {
  reference: string;
  service_id: string;
  service_title: string;
  customer_name: string;
  whatsapp: string;
  details: Record<string, string>;
  delivery_location: DeliveryLocation;
}

export interface IndividualOrderRow extends IndividualOrderRecord {
  id: string;
  status: BulkStatus;
  cancellation_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  institution_id?: string | null;
  institution_name_snapshot?: string | null;
}

export async function saveIndividualOrder(record: IndividualOrderRecord): Promise<void> {
  const { error } = await getSupabase().from('individual_orders').insert(record);
  if (error) throw new Error('Individual order could not be saved.');
}

interface IndividualOrderQueryRow extends Omit<IndividualOrderRow, 'admin_notes'> {
  individual_order_notes: { notes: string }[] | null;
}

export async function fetchIndividualOrders(): Promise<IndividualOrderRow[]> {
  const { data, error } = await getSupabase()
    .from('individual_orders')
    .select(
      'id, reference, service_id, service_title, customer_name, whatsapp, details, delivery_location, status, cancellation_reason, created_at, institution_id, institution_name_snapshot, individual_order_notes(notes)',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error('Orders could not be loaded.');
  return ((data ?? []) as IndividualOrderQueryRow[]).map(({ individual_order_notes, ...order }) => ({
    ...order,
    admin_notes: individual_order_notes?.[0]?.notes || null,
  }));
}

export async function updateIndividualOrderStatus(
  id: string,
  status: BulkStatus,
  cancellationReason: string,
): Promise<void> {
  const { data, error } = await getSupabase()
    .from('individual_orders')
    .update({
      status,
      cancellation_reason: status === 'Cancelled' ? cancellationReason.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');

  if (error || !data || data.length === 0) throw new Error('Order status could not be updated.');
}

export interface OrderStatusEvent {
  status: BulkStatus;
  reason: string | null;
  created_at: string;
}

export async function fetchOrderStatusEvents(orderId: string): Promise<OrderStatusEvent[]> {
  const { data, error } = await getSupabase()
    .from('order_status_events')
    .select('status, reason, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Status history could not be loaded.');
  return (data ?? []) as OrderStatusEvent[];
}

export async function updateIndividualOrderNotes(id: string, notes: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('individual_order_notes')
    .upsert({ order_id: id, notes: notes.trim(), updated_at: new Date().toISOString() }, { onConflict: 'order_id' })
    .select('order_id');

  if (error || !data || data.length === 0) throw new Error('Notes could not be saved.');
}
