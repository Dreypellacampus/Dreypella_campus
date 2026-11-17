import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import FieldsStep from '@/components/order/FieldsStep';
import InstitutionPicker from '@/components/account/InstitutionPicker';
import { CUSTOMER_CATEGORY_FIELD, EMAIL_FIELD, LEVEL_OF_STUDY_FIELD, INSTITUTION_SUBMISSION_FIELD, SIGN_IN_PASSWORD_FIELD, SIGN_UP_FIELDS } from '@/data/accountFields';
import type { ServiceField } from '@/data/services';
import { sendPasswordReset, signInWithPassword, signUpWithPassword } from '@/lib/auth';
import { valuesToProfile } from '@/lib/customerProfile';
import { saveCustomerProfile } from '@/lib/customerProfileRepository';
import { getSupabase } from '@/lib/supabase';
import { omitErrors, validateFields, type FieldErrors } from '@/lib/validation';

export type AuthMode = 'signin' | 'signup' | 'forgot';

const SIGN_IN_FIELDS: ServiceField[] = [EMAIL_FIELD, SIGN_IN_PASSWORD_FIELD];
const FORGOT_FIELDS: ServiceField[] = [EMAIL_FIELD];

const MODE_COPY: Record<AuthMode, { title: string; intro: string; submit: string }> = {
  signin: {
    title: 'Sign in to your account',
    intro: 'Sign in to see your orders and manage your profile.',
    submit: 'Sign in',
  },
  signup: {
    title: 'Create your account',
    intro: 'Your details make every future order faster. Your email and password are only used to sign in.',
    submit: 'Create account',
  },
  forgot: {
    title: 'Reset your password',
    intro: 'Enter the email address you registered with and we will send you a link to choose a new password.',
    submit: 'Send reset link',
  },
};

const STUDENT_CATEGORIES = ['LAUTECH student', 'Student of another institution'];

function isStudentCategory(category: string): boolean {
  return STUDENT_CATEGORIES.includes(category);
}

interface AuthFormProps {
  initialMode: AuthMode;
  onDone: () => void;
}

export default function AuthForm({ initialMode, onDone }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingProfile, setPendingProfile] = useState(false);

  const fields = mode === 'signup' ? SIGN_UP_FIELDS : mode === 'forgot' ? FORGOT_FIELDS : SIGN_IN_FIELDS;
  const copy = MODE_COPY[mode];
  const showInstitutionPicker = mode === 'signup' && isStudentCategory(values.customerCategory ?? '');

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
    setNotice(null);
  };

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => omitErrors(current, (key) => key === name));
  };

  const handleInstitutionChange = (id: string, name: string) => {
    setValues((current) => ({ ...current, institutionId: id, institution: name }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const found = validateFields(fields, values);
    if (mode === 'signup' && !values.area?.trim()) {
      found.area = 'Please enter your area or neighbourhood.';
    }
    if (mode === 'signup' && isStudentCategory(values.customerCategory ?? '') && !values.institutionId) {
      found.institutionId = 'Please select your institution.';
    }
    if (mode === 'signup' && !values.customerCategory) {
      found.customerCategory = 'Please select your customer type.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const email = values.email.trim();
    setBusy(true);

    try {
      if (mode === 'signin') {
        await signInWithPassword(email, values.password);
        if (pendingProfile) {
          try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if (!user) throw new Error('Your sign-in session could not be verified.');
            await saveCustomerProfile(user.id, valuesToProfile(values));
            setPendingProfile(false);
          } catch {
            setFormError('You are signed in, but your registration details could not be saved. Open My profile and complete the required fields.');
            return;
          }
        }
        onDone();
        return;
      }

      if (mode === 'forgot') {
        await sendPasswordReset(email);
        setNotice('If an account exists for that email, a reset link is on the way. Check your inbox.');
        return;
      }

      const { userId, needsConfirmation } = await signUpWithPassword(email, values.password);
      if (needsConfirmation || !userId) {
        setNotice('Account created. Confirm your email address, then sign in to save your registration details.');
        setPendingProfile(true);
        setMode('signin');
        setErrors({});
        return;
      }

      try {
        await saveCustomerProfile(userId, valuesToProfile(values));
      } catch {
        setFormError(
          'Your account was created, but your details were not saved. Sign in and complete them on your profile page.'
        );
        return;
      }
      onDone();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-navy-100 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-10">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-red-500">Dreypella Campus account</p>
        <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{copy.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldsStep intro={copy.intro} fields={fields} values={values} errors={errors} onChange={handleChange} />

        {mode === 'signup' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="customerCategory" className="text-sm font-bold text-navy-900">
                {CUSTOMER_CATEGORY_FIELD.label}
              </label>
              <select
                id="customerCategory"
                value={values.customerCategory ?? ''}
                onChange={(event) => handleChange('customerCategory', event.target.value)}
                className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
              >
                <option value="">Select your customer type</option>
                {CUSTOMER_CATEGORY_FIELD.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.customerCategory && (
                <p className="text-sm font-semibold text-red-600">{errors.customerCategory}</p>
              )}
              <p className="text-xs text-navy-600">{CUSTOMER_CATEGORY_FIELD.helper}</p>
            </div>

            {showInstitutionPicker && (
              <div className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-mist p-4">
                <InstitutionPicker
                  value={values.institutionId ?? ''}
                  nameValue={values.institution ?? ''}
                  onChange={handleInstitutionChange}
                  required
                  error={errors.institutionId}
                />
                <div className="flex flex-col gap-2">
                  <label htmlFor="levelOfStudy" className="text-sm font-bold text-navy-900">
                    {LEVEL_OF_STUDY_FIELD.label}
                  </label>
                  <input
                    id="levelOfStudy"
                    type="text"
                    value={values.levelOfStudy ?? ''}
                    onChange={(event) => handleChange('levelOfStudy', event.target.value)}
                    placeholder={LEVEL_OF_STUDY_FIELD.placeholder}
                    className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="institutionSubmission" className="text-sm font-bold text-navy-900">
                    {INSTITUTION_SUBMISSION_FIELD.label}
                  </label>
                  <input
                    id="institutionSubmission"
                    type="text"
                    value={values.institutionSubmission ?? ''}
                    onChange={(event) => handleChange('institutionSubmission', event.target.value)}
                    placeholder={INSTITUTION_SUBMISSION_FIELD.placeholder}
                    className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {formError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {formError}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm font-semibold text-navy-800">
            {notice}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full px-6 py-3 text-sm">
          {busy ? 'Please wait...' : copy.submit}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-3 text-center text-sm font-bold">
        {mode === 'signin' && (
          <>
            <button type="button" onClick={() => switchMode('forgot')} className="text-red-600 hover:underline">
              Forgot your password?
            </button>
            <button type="button" onClick={() => switchMode('signup')} className="text-navy-900 hover:underline">
              New here? Create an account
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button type="button" onClick={() => switchMode('signin')} className="text-navy-900 hover:underline">
            Already have an account? Sign in
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" onClick={() => switchMode('signin')} className="text-navy-900 hover:underline">
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
