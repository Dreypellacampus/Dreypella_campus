import { getSupabase } from '@/lib/supabase';

export interface InstitutionAdminRow {
  user_id: string;
  email: string;
  active: boolean;
  created_at: string;
}

export async function fetchInstitutionAdmins(institutionId: string): Promise<InstitutionAdminRow[]> {
  const { data, error } = await getSupabase().rpc('admin_list_institution_admins', { p_institution_id: institutionId });
  if (error) throw new Error(error.message || 'Institution administrators could not be loaded.');
  return (data ?? []) as InstitutionAdminRow[];
}

export async function assignInstitutionAdmin(email: string, institutionId: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_assign_institution_admin', {
    p_email: email,
    p_institution_id: institutionId,
  });
  if (error) throw new Error(error.message || 'Institution administrator could not be assigned.');
}

export async function setInstitutionAdminActive(userId: string, active: boolean): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_institution_admin_active', {
    p_user_id: userId,
    p_active: active,
  });
  if (error) throw new Error(error.message || 'Institution administrator assignment could not be updated.');
}
