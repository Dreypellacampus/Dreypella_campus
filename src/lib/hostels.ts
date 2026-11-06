import { getSupabase } from '@/lib/supabase';

export type HostelKind = 'on-campus' | 'off-campus';

export interface Hostel {
  id: string;
  name: string;
  location_type: HostelKind;
}

function failure(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('That name is already in this list.');
  return new Error('Something went wrong. Please try again.');
}

export async function fetchHostels(): Promise<Hostel[]> {
  const { data, error } = await getSupabase()
    .from('hostels')
    .select('id, name, location_type')
    .order('name', { ascending: true });

  if (error) throw failure(error);
  return (data ?? []) as Hostel[];
}

export async function addHostel(name: string, kind: HostelKind): Promise<void> {
  const { error } = await getSupabase().from('hostels').insert({ name, location_type: kind });
  if (error) throw failure(error);
}

export async function renameHostel(id: string, name: string): Promise<void> {
  const { error } = await getSupabase().from('hostels').update({ name }).eq('id', id);
  if (error) throw failure(error);
}

export async function removeHostel(id: string): Promise<void> {
  const { error } = await getSupabase().from('hostels').delete().eq('id', id);
  if (error) throw failure(error);
}
