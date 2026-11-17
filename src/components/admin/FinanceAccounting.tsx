import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatNaira } from '@/lib/format';
import { getSupabase } from '@/lib/supabase';

type EntryType = 'income' | 'expense';
interface Institution { id: string; name: string }
interface Partner { id: string; full_name: string }
interface FinanceEntry {
  id: string; entry_type: EntryType; category: string; description: string;
  amount_kobo: number; transaction_date: string; institution_id: string | null;
  partner_id: string | null; reference: string | null; created_at: string;
}
interface Assignment { partner_id: string; fee: number }
const FIELD = 'w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900';
const naira = (kobo: number) => formatNaira(Number(kobo || 0) / 100);

export default function FinanceAccounting() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [type, setType] = useState<EntryType>('expense');
  const [category, setCategory] = useState('operating_expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [institutionId, setInstitutionId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [reference, setReference] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const db = getSupabase();
      const [ledger, institutionRows, partnerRows, assignmentRows] = await Promise.all([
        db.from('campus_finance_entries').select('id,entry_type,category,description,amount_kobo,transaction_date,institution_id,partner_id,reference,created_at').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
        db.from('institutions').select('id,name').order('name'),
        db.from('delivery_partners').select('id,full_name').order('full_name'),
        db.from('delivery_assignments').select('partner_id,fee'),
      ]);
      if (ledger.error) throw ledger.error;
      if (institutionRows.error) throw institutionRows.error;
      if (partnerRows.error) throw partnerRows.error;
      if (assignmentRows.error) throw assignmentRows.error;
      setEntries((ledger.data ?? []) as FinanceEntry[]);
      setInstitutions((institutionRows.data ?? []) as Institution[]);
      setPartners((partnerRows.data ?? []) as Partner[]);
      setAssignments((assignmentRows.data ?? []) as Assignment[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Finance records could not be loaded.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => entries.filter(e => !filterInstitution || e.institution_id === filterInstitution), [entries, filterInstitution]);
  const income = filtered.filter(e => e.entry_type === 'income').reduce((s,e) => s + Number(e.amount_kobo), 0);
  const expenses = filtered.filter(e => e.entry_type === 'expense').reduce((s,e) => s + Number(e.amount_kobo), 0);
  const partnerRows = partners.map(p => {
    const earnedNaira = assignments.filter(a => a.partner_id === p.id).reduce((s,a) => s + Number(a.fee || 0), 0);
    const paidKobo = entries.filter(e => e.category === 'partner_payout' && e.partner_id === p.id).reduce((s,e) => s + Number(e.amount_kobo), 0);
    return { ...p, earnedNaira, paidKobo, dueKobo: Math.max(0, earnedNaira * 100 - paidKobo) };
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const amountNaira = Number(amount);
      if (!Number.isFinite(amountNaira) || amountNaira <= 0) throw new Error('Enter an amount greater than zero.');
      if (category === 'partner_payout' && (!partnerId || type !== 'expense')) throw new Error('Choose a partner for a partner payout.');
      const { data: auth } = await getSupabase().auth.getUser();
      if (!auth.user) throw new Error('Please sign in again.');
      const { error: insertError } = await getSupabase().from('campus_finance_entries').insert({
        entry_type: type, category, description: description.trim(),
        amount_kobo: Math.round(amountNaira * 100), transaction_date: date,
        institution_id: institutionId || null, partner_id: category === 'partner_payout' ? partnerId : null,
        reference: reference.trim() || null, created_by: auth.user.id,
      });
      if (insertError) throw insertError;
      setDescription(''); setAmount(''); setReference(''); setPartnerId('');
      setNotice('Accounting entry saved. Reconcile it against the supporting bank or business record.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'The accounting entry could not be saved.'); }
    finally { setBusy(false); }
  };

  const fieldChangeType = (next: EntryType) => {
    setType(next);
    setCategory(next === 'income' ? 'service_income' : 'operating_expense');
    if (next === 'income') setPartnerId('');
  };

  return <section className="flex flex-col gap-5">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-red-500">Main administrator only</p>
      <h2 className="mt-1 text-xl font-extrabold text-navy-900">Finance &amp; Accounting</h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">Record company income and expenses, partner payouts and institution-level entries. These are accounting records, not live bank balances or automatically verified transactions.</p>
    </div>
    <label className="max-w-sm text-sm font-semibold text-navy-800">Report scope
      <select className={FIELD + ' mt-1'} value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)}>
        <option value="">All institutions · consolidated</option>
        {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Recorded income</p><p className="mt-1 text-xl font-extrabold text-navy-900">{naira(income)}</p></div>
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Recorded expenses</p><p className="mt-1 text-xl font-extrabold text-navy-900">{naira(expenses)}</p></div>
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Net recorded result</p><p className={'mt-1 text-xl font-extrabold ' + (income-expenses >= 0 ? 'text-emerald-700' : 'text-red-600')}>{naira(income-expenses)}</p></div>
    </div>
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-5 sm:grid-cols-2">
      <h3 className="font-extrabold text-navy-900 sm:col-span-2">Add accounting entry</h3>
      <label className="text-sm font-semibold">Entry type<select className={FIELD + ' mt-1'} value={type} onChange={e => fieldChangeType(e.target.value as EntryType)}><option value="income">Income</option><option value="expense">Expense</option></select></label>
      <label className="text-sm font-semibold">Category<select className={FIELD + ' mt-1'} value={category} onChange={e => setCategory(e.target.value)}>{type === 'income' ? <><option value="service_income">Service income</option><option value="other_income">Other income</option><option value="adjustment">Adjustment</option></> : <><option value="operating_expense">Operating expense</option><option value="marketing">Marketing</option><option value="transport">Transport</option><option value="refund">Refund</option><option value="partner_payout">Delivery partner payout</option><option value="other_expense">Other expense</option><option value="adjustment">Adjustment</option></>}</select></label>
      <label className="text-sm font-semibold">Description<input className={FIELD + ' mt-1'} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} required minLength={2} placeholder="What was this money received or spent for?" /></label>
      <label className="text-sm font-semibold">Amount (₦)<input className={FIELD + ' mt-1'} type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
      <label className="text-sm font-semibold">Transaction date<input className={FIELD + ' mt-1'} type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>
      <label className="text-sm font-semibold">Institution<select className={FIELD + ' mt-1'} value={institutionId} onChange={e => setInstitutionId(e.target.value)}><option value="">Company-wide / not institution-specific</option>{institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
      {category === 'partner_payout' && <label className="text-sm font-semibold">Delivery partner<select className={FIELD + ' mt-1'} value={partnerId} onChange={e => setPartnerId(e.target.value)} required><option value="">Choose partner</option>{partners.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>}
      <label className="text-sm font-semibold">Bank / transaction reference (optional)<input className={FIELD + ' mt-1'} value={reference} onChange={e => setReference(e.target.value)} maxLength={160} /></label>
      <button disabled={busy} className="rounded-full bg-navy-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? 'Saving...' : 'Save accounting entry'}</button>
    </form>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="rounded-2xl border border-navy-100 bg-white p-5">
      <h3 className="font-extrabold text-navy-900">Delivery partner earnings &amp; payouts</h3>
      <p className="mt-1 text-xs text-navy-600">Earnings are calculated from assigned delivery fees (whole naira). Payouts are the expense entries recorded above; balances are indicative and require review before payment.</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-navy-500"><th className="py-2 pr-3">Partner</th><th className="pr-3">Assigned earnings</th><th className="pr-3">Payouts recorded</th><th>Indicative due</th></tr></thead><tbody>{partnerRows.map(p => <tr key={p.id} className="border-b border-navy-50"><td className="py-2 pr-3 font-semibold">{p.full_name}</td><td className="pr-3">{formatNaira(p.earnedNaira)}</td><td className="pr-3">{naira(p.paidKobo)}</td><td>{naira(p.dueKobo)}</td></tr>)}</tbody></table></div>
    </div>
    <div className="rounded-2xl border border-navy-100 bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-navy-900">Ledger history</h3><button type="button" onClick={() => void load()} className="rounded-full border border-navy-200 px-3 py-2 text-xs font-bold">Refresh</button></div>
      {loading ? <p className="py-5 text-sm text-navy-600">Loading accounting entries...</p> : filtered.length === 0 ? <p className="py-5 text-sm text-navy-600">No entries recorded for this scope yet.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b text-xs text-navy-500"><th className="py-2 pr-3">Date</th><th className="pr-3">Type / category</th><th className="pr-3">Description</th><th className="pr-3">Institution</th><th className="pr-3">Reference</th><th className="text-right">Amount</th></tr></thead><tbody>{filtered.map(e => <tr key={e.id} className="border-b border-navy-50"><td className="py-2 pr-3 whitespace-nowrap">{e.transaction_date}</td><td className="pr-3 capitalize">{e.entry_type} · {e.category.replace(/_/g,' ')}</td><td className="pr-3">{e.description}</td><td className="pr-3">{institutions.find(i => i.id === e.institution_id)?.name ?? 'Company-wide'}</td><td className="pr-3">{e.reference || '—'}</td><td className="text-right font-semibold">{e.entry_type === 'expense' ? '−' : '+'}{naira(e.amount_kobo)}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
