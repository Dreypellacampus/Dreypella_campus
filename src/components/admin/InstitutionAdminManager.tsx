import { useCallback, useEffect, useState } from 'react';
import { UserPlus, UserRound, UserX } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  assignInstitutionAdmin,
  fetchInstitutionAdmins,
  setInstitutionAdminActive,
  type InstitutionAdminRow,
} from '@/lib/institutionAdminRepository';

const FIELD = 'w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function InstitutionAdminManager({ institutionId }: { institutionId: string }) {
  const [email, setEmail] = useState('');
  const [admins, setAdmins] = useState<InstitutionAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAdmins(await fetchInstitutionAdmins(institutionId));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Administrator list could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { void load(); }, [load]);

  const handleAssign = async () => {
    if (!email.trim()) {
      setError('Enter the staff member email address.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await assignInstitutionAdmin(email.trim(), institutionId);
      setEmail('');
      setNotice('Institution administrator assigned.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The administrator could not be assigned.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (admin: InstitutionAdminRow) => {
    setError(null);
    try {
      await setInstitutionAdminActive(admin.user_id, !admin.active);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Assignment could not be updated.');
    }
  };

  return (
    <section className="flex flex-col gap-4 border-t border-navy-100 pt-5">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500">Institution administrators</h3>
        <p className="mt-1 text-xs leading-relaxed text-navy-600">Assign an existing Dreypella Campus account. Staff without an account must sign up first.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Staff account email" className={FIELD} aria-label="Institution administrator email" />
        <Button onClick={handleAssign} disabled={saving} className="shrink-0 px-5 py-3 text-sm"><UserPlus className="h-4 w-4" aria-hidden="true" />{saving ? 'Assigning...' : 'Assign admin'}</Button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p>}
      {loading && <p className="text-sm text-navy-600">Loading administrators...</p>}
      {!loading && admins.length === 0 && <p className="text-sm text-navy-600">No administrators assigned yet.</p>}
      {admins.length > 0 && (
        <ul className="flex flex-col gap-2">
          {admins.map((admin) => (
            <li key={admin.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-navy-900"><UserRound className="h-4 w-4 shrink-0 text-navy-500" /><span className="truncate">{admin.email}</span></span>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${admin.active ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-600'}`}>{admin.active ? 'Active' : 'Inactive'}</span>
                <button type="button" onClick={() => void handleToggle(admin)} className="rounded-lg p-2 text-navy-600 hover:bg-navy-50" aria-label={admin.active ? 'Deactivate administrator' : 'Reactivate administrator'}><UserX className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
