import { getSupabase } from '@/lib/supabase';
import type { DeliveryLocation } from '@/lib/deliveryLocation';

export interface CustomerBulkOrder {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  service_type: string;
  items: { name: string; quantity: number; specs: string }[];
  delivery_date: string;
  delivery_time: string;
  delivery_location: DeliveryLocation;
  institution_name_snapshot: string | null;
  created_at: string;
}

export async function fetchCustomerBulkOrders(): Promise<CustomerBulkOrder[]> {
  const { data, error } = await getSupabase().rpc('customer_list_own_bulk_orders');
  if (error) throw new Error('Your bulk order history could not be loaded.');
  return (data ?? []) as CustomerBulkOrder[];
}
