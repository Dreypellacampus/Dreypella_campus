import { getSupabase } from '@/lib/supabase';

export type InstitutionType = 'University' | 'Polytechnic' | 'College of Education' | 'Other';

export interface Institution {
  id: string;
  name: string;
  institution_type: InstitutionType;
  location: string;
  town: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

export interface InstitutionWithCount extends Institution {
  customer_count: number;
}

export async function fetchActiveInstitutions(): Promise<Institution[]> {
  const { data, error } = await getSupabase()
    .from('institutions')
    .select('id, name, institution_type, location, town, logo_url, active, created_at')
    .eq('active', true)
    .order('name', { ascending: true });
  if (error) throw new Error('Institutions could not be loaded.');
  return (data ?? []) as Institution[];
}

export async function fetchInstitutions(): Promise<Institution[]> {
  const { data, error } = await getSupabase()
    .from('institutions')
    .select('id, name, institution_type, location, town, logo_url, active, created_at')
    .order('name', { ascending: true });
  if (error) throw new Error('Institutions could not be loaded.');
  return (data ?? []) as Institution[];
}

export async function fetchInstitutionsWithCounts(): Promise<InstitutionWithCount[]> {
  const institutions = await fetchInstitutions();
  const { data: profileCounts, error } = await getSupabase()
    .from('profiles')
    .select('institution_id')
    .not('institution_id', 'is', null);

  if (error) return institutions.map((inst) => ({ ...inst, customer_count: 0 }));

  const counts = new Map<string, number>();
  for (const row of profileCounts ?? []) {
    const id = row.institution_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return institutions.map((inst) => ({
    ...inst,
    customer_count: counts.get(inst.id) ?? 0,
  }));
}

export async function saveInstitution(
  institution: Omit<Institution, 'id' | 'logo_url' | 'active' | 'created_at'> & {
    id?: string;
    logo_url?: string | null;
    active?: boolean;
  },
): Promise<void> {
  const payload = { ...institution, updated_at: new Date().toISOString() };
  const { error } = await getSupabase().from('institutions').upsert(payload, { onConflict: 'id' });
  if (error) throw new Error('Institution could not be saved.');
}

export async function setInstitutionActive(id: string, active: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from('institutions')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error('Institution status could not be changed.');
}
