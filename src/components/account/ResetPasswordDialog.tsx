import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import FieldsStep from '@/components/order/FieldsStep';
import { PASSWORD_FIELD } from '@/data/accountFields';
import type { ServiceField } from '@/data/services';
import { updatePassword } from '@/lib/auth';
import { omitErrors, validateFields, type FieldErrors } from '@/lib/validation';

const NEW_PASSWORD_FIELD: ServiceField = { ...PASSWORD_FIELD, name: 'newPassword', label: 'New password' };

const RESET_FIELDS: ServiceField[] = [
  NEW_PASSWORD_FIELD,
  {
    name: 'confirmPassword',
    label: 'Confirm new password',
    type: 'password',
    required: true,
    autoComplete: 'new-password',
  },
];

interface ResetPasswordDialogProps {
  onDone: () => void;
}

export default function ResetPasswordDialog({ onDone }: ResetPasswordDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => omitErrors(current, (key) => key === name));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const found = validateFields(RESET_FIELDS, values);
    if (!found.confirmPassword && values.newPassword !== values.confirmPassword) {
      found.confirmPassword = 'The two passwords do not match';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await updatePassword(values.newPassword);
      onDone();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Your password could not be changed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      eyebrow="Password reset"
      title="Choose a new password"
      onClose={onDone}
      footer={
        <Button type="submit" form="reset-password-form" disabled={busy} className="w-full px-6 py-3 text-sm">
          {busy ? 'Saving...' : 'Save new password'}
        </Button>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldsStep
          intro="Enter a new password for your Dreypella account. You will stay signed in on this device."
          fields={RESET_FIELDS}
          values={values}
          errors={errors}
          onChange={handleChange}
        />
        {formError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {formError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
