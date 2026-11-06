import { getSupabase } from '@/lib/supabase';

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error('Admin access could not be checked.');
  return data !== null;
}
