import { getSupabase } from '@/lib/supabase';
import type { CustomerProfile } from '@/lib/customerProfile';

const PROFILE_COLUMNS = 'full_name, whatsapp, preferred_address, institution, institution_id, department, student_status, customer_category, level_of_study, institution_submission';

export async function fetchCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error('Your profile could not be loaded.');
  return data as CustomerProfile | null;
}

export async function fetchCustomerProfiles(): Promise<CustomerProfile[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('full_name', { ascending: true });

  if (error) throw new Error('Customers could not be loaded.');
  return (data ?? []) as CustomerProfile[];
}

export async function saveCustomerProfile(userId: string, profile: CustomerProfile): Promise<void> {
  const { error } = await getSupabase()
    .from('profiles')
    .upsert({ ...profile, id: userId, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) throw new Error('Your profile could not be saved. Please try again.');
}
