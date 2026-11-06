import { getSupabase } from '@/lib/supabase';

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  created_at: string;
}

export async function fetchSavedAddresses(): Promise<SavedAddress[]> {
  const { data, error } = await getSupabase()
    .from('saved_addresses')
    .select('id, label, address, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Saved addresses could not be loaded.');
  return (data ?? []) as SavedAddress[];
}

export async function createSavedAddress(label: string, address: string): Promise<void> {
  const { error } = await getSupabase().from('saved_addresses').insert({ label, address });
  if (error) throw new Error('This address could not be saved. Please try again.');
}

export async function deleteSavedAddress(id: string): Promise<void> {
  const { data, error } = await getSupabase().from('saved_addresses').delete().eq('id', id).select('id');
  if (error || !data || data.length === 0) throw new Error('This address could not be removed. Please try again.');
}
