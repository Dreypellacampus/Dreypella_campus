import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, UserRound } from 'lucide-react';
import FieldsStep from '@/components/order/FieldsStep';
import InstitutionPicker from '@/components/account/InstitutionPicker';
import Button from '@/components/ui/Button';
import { PageShell } from '@/components/account/SignedOutPrompt';
import { AREA_FIELD, BASE_PROFILE_FIELDS, CUSTOMER_CATEGORY_OPTIONS, LEVEL_OF_STUDY_FIELD, INSTITUTION_SUBMISSION_FIELD } from '@/data/accountFields';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { profileToValues, valuesToProfile } from '@/lib/customerProfile';
import { fetchCustomerProfile, saveCustomerProfile } from '@/lib/customerProfileRepository';
import { omitErrors, validateFields, type FieldErrors } from '@/lib/validation';

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

const STUDENT_CATEGORIES = ['LAUTECH student', 'Student of another institution'];

export default function ProfilePage() {
  const session = useCustomerSession();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const userId = session.userId;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    (async () => {
      try {
        const profile = await fetchCustomerProfile(userId);
        if (!active) return;
        setValues(profileToValues(profile));
        setLoad({ status: 'ready' });
      } catch (caught) {
        if (!active) return;
        setLoad({ status: 'error', message: caught instanceof Error ? caught.message : 'Please try again.' });
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  if (!userId) {
    return (
      <PageShell>
        <p className="text-center text-sm text-navy-700">Checking your account...</p>
      </PageShell>
    );
  }

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => omitErrors(current, (key) => key === name));
    setSaved(false);
  };

  const handleInstitutionChange = (id: string, name: string) => {
    setValues((current) => ({ ...current, institutionId: id, institution: name }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);

    const found = validateFields([...BASE_PROFILE_FIELDS, AREA_FIELD], values);
    if (STUDENT_CATEGORIES.includes(values.customerCategory ?? '') && !values.institutionId) {
      found.institutionId = 'Please select your institution.';
    }
    if (!values.customerCategory) {
      found.customerCategory = 'Please select your customer type.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await saveCustomerProfile(userId, valuesToProfile(values));
      setSaved(true);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const showInstitutionFields = STUDENT_CATEGORIES.includes(values.customerCategory ?? '');

  return (
    <PageShell>
      <div className="flex flex-col gap-6 rounded-3xl border border-navy-100 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">My profile</p>
          <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Your details</h1>
          <p className="text-sm text-navy-700">Signed in as {session.email}</p>
        </div>

        {load.status === 'loading' && <p className="text-sm text-navy-700">Loading your details...</p>}

        {load.status === 'error' && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            Your profile could not be loaded. {load.message}
          </p>
        )}

        {load.status === 'ready' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            <FieldsStep
              intro="These details fill in your orders and let us reach you on WhatsApp. Keep them up to date."
              fields={[...BASE_PROFILE_FIELDS, AREA_FIELD]}
              values={values}
              errors={errors}
              onChange={handleChange}
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="customerCategory" className="text-sm font-bold text-navy-900">
                Customer type
              </label>
              <select
                id="customerCategory"
                value={values.customerCategory ?? ''}
                onChange={(event) => handleChange('customerCategory', event.target.value)}
                className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100"
              >
                <option value="">Select your customer type</option>
                {CUSTOMER_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.customerCategory && (
                <p className="text-sm font-semibold text-red-600">{errors.customerCategory}</p>
              )}
            </div>

            {showInstitutionFields && (
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

            {saveError && (
              <p role="alert" className="text-sm font-semibold text-red-600">
                {saveError}
              </p>
            )}
            {saved && (
              <p role="status" className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                <CheckCircle2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                Your profile has been saved.
              </p>
            )}

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
