import { getSupabase } from '@/lib/supabase';

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

function isNotificationRow(value: unknown): value is NotificationRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.message === 'string' &&
    (row.read_at === null || typeof row.read_at === 'string') &&
    typeof row.created_at === 'string'
  );
}

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('id, title, message, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !Array.isArray(data) || !data.every(isNotificationRow)) {
    throw new Error('Your notifications could not be loaded.');
  }
  return data;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { data, error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .select('id');

  if (error || !data || data.length === 0) throw new Error('Notifications could not be updated.');
}
