import type { AuthError } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

const AUTH_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'The email or password is incorrect.',
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Email not confirmed': 'Please confirm your email address before signing in.',
};

function authError(error: AuthError): Error {
  return new Error(AUTH_MESSAGES[error.message] ?? error.message);
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw authError(error);
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ userId: string | null; needsConfirmation: boolean }> {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw authError(error);
  return { userId: data.user?.id ?? null, needsConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error('Could not sign out. Please try again.');
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw authError(error);
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw authError(error);
}
