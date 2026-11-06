import { getSupabase } from '@/lib/supabase';
import type { DeliveryLocation } from '@/lib/deliveryLocation';
import type { BulkStatus } from '@/lib/bulkOrder';

export interface DeliveryPartner {
  id: string;
  full_name: string;
  whatsapp: string;
  active: boolean;
}

export interface PartnerOrder {
  id: string;
  reference: string;
  service_title: string;
  customer_name: string;
  whatsapp: string;
  delivery_location: DeliveryLocation;
  status: BulkStatus;
}

export interface PartnerAssignment {
  orderId: string;
  fee: number;
  assignedAt: string;
  deliveredAt: string | null;
  order: PartnerOrder;
}

interface AssignmentQueryRow {
  order_id: string;
  fee: number;
  assigned_at: string;
  delivered_at: string | null;
  individual_orders: PartnerOrder | PartnerOrder[] | null;
}

export async function fetchDeliveryPartner(userId: string): Promise<DeliveryPartner | null> {
  const { data, error } = await getSupabase()
    .from('delivery_partners')
    .select('id, full_name, whatsapp, active')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error('Your partner profile could not be loaded.');
  return (data as DeliveryPartner | null) ?? null;
}

export async function fetchPartnerAssignments(partnerId: string): Promise<PartnerAssignment[]> {
  const { data, error } = await getSupabase()
    .from('delivery_assignments')
    .select(
      'order_id, fee, assigned_at, delivered_at, individual_orders(id, reference, service_title, customer_name, whatsapp, delivery_location, status)',
    )
    .eq('partner_id', partnerId)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error('Your assigned orders could not be loaded.');

  return ((data ?? []) as AssignmentQueryRow[])
    .map((row) => ({
      row,
      order: Array.isArray(row.individual_orders) ? (row.individual_orders[0] ?? null) : row.individual_orders,
    }))
    .filter((item): item is { row: AssignmentQueryRow; order: PartnerOrder } => item.order !== null)
    .map(({ row, order }) => ({
      orderId: row.order_id,
      fee: row.fee,
      assignedAt: row.assigned_at,
      deliveredAt: row.delivered_at,
      order,
    }));
}

export async function markOrderDelivered(orderId: string): Promise<void> {
  const { data, error } = await getSupabase().rpc('partner_update_delivery_status', {
    p_order_id: orderId,
    p_status: 'Delivered',
  });

  if (error || data !== 'Delivered') throw new Error('The order could not be marked as delivered.');
}

export async function fetchAllDeliveryPartners(): Promise<DeliveryPartner[]> {
  const { data, error } = await getSupabase()
    .from('delivery_partners')
    .select('id, full_name, whatsapp, active')
    .order('full_name', { ascending: true });

  if (error) throw new Error('Delivery partners could not be loaded.');
  return (data ?? []) as DeliveryPartner[];
}

export async function addDeliveryPartner(email: string, fullName: string, whatsapp: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_add_delivery_partner', {
    p_email: email,
    p_full_name: fullName,
    p_whatsapp: whatsapp,
  });

  if (error) throw new Error(error.message || 'The delivery partner could not be added.');
}

export async function setDeliveryPartnerActive(id: string, active: boolean): Promise<void> {
  const { data, error } = await getSupabase()
    .from('delivery_partners')
    .update({ active })
    .eq('id', id)
    .select('id');

  if (error || !data || data.length === 0) throw new Error('The partner status could not be updated.');
}

export interface OrderAssignment {
  partner_id: string;
  fee: number;
  delivered_at: string | null;
}

export async function fetchOrderAssignment(orderId: string): Promise<OrderAssignment | null> {
  const { data, error } = await getSupabase()
    .from('delivery_assignments')
    .select('partner_id, fee, delivered_at')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw new Error('The delivery assignment could not be loaded.');
  return (data as OrderAssignment | null) ?? null;
}

export async function saveOrderAssignment(orderId: string, partnerId: string, fee: number): Promise<void> {
  const { data, error } = await getSupabase()
    .from('delivery_assignments')
    .upsert(
      { order_id: orderId, partner_id: partnerId, fee, assigned_at: new Date().toISOString() },
      { onConflict: 'order_id' },
    )
    .select('order_id');

  if (error || !data || data.length === 0) throw new Error('The delivery assignment could not be saved.');
}

export async function removeOrderAssignment(orderId: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('delivery_assignments')
    .delete()
    .eq('order_id', orderId)
    .is('delivered_at', null)
    .select('order_id');

  if (error || !data || data.length === 0) throw new Error('The delivery assignment could not be removed.');
}
