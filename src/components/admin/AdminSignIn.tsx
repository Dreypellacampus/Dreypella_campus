import { useState, type FormEvent } from 'react';
import { LockKeyhole, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import { signInWithPassword, signUpWithPassword } from '@/lib/auth';

const MIN_PASSWORD_LENGTH = 6;

export default function AdminSignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const { needsConfirmation } = await signUpWithPassword(trimmedEmail, password);
        if (needsConfirmation) {
          setNotice('Account created. Sign in with your email and password to continue.');
          setMode('signin');
        }
      } else {
        await signInWithPassword(trimmedEmail, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-900 placeholder:text-navy-400 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-navy-100 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-extrabold text-navy-900">
        {isSignUp ? 'Create an admin account' : 'Admin sign in'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-700">
        {isSignUp
          ? 'Access is only granted to accounts the site owner has approved.'
          : 'Sign in to view bulk requests and manage hostels.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-navy-900">Email</span>
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputClass} pl-11`}
            />
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-navy-900">Password</span>
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm font-semibold text-navy-700">
            {notice}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(isSignUp ? 'signin' : 'signup');
          setError(null);
          setNotice(null);
        }}
        className="mt-5 w-full text-center text-sm font-bold text-red-600 hover:underline"
      >
        {isSignUp ? 'Already have an account? Sign in' : 'Need an admin account? Create one'}
      </button>
    </div>
  );
}
