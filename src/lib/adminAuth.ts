import { getSupabase } from '@/lib/supabase';

export interface InstitutionAdminAssignment {
  institution_id: string;
  active: boolean;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error('Admin access could not be checked.');
  return data !== null;
}

export async function getInstitutionAdminAssignment(userId: string): Promise<InstitutionAdminAssignment | null> {
  const { data, error } = await getSupabase()
    .from('institution_admins')
    .select('institution_id, active')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (error) throw new Error('Institution administrator access could not be checked.');
  return data as InstitutionAdminAssignment | null;
}
