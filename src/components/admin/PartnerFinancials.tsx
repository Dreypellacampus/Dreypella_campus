import { useEffect, useState } from 'react';
import { formatNaira } from '@/lib/format';
import { fetchPartnerFinancials, type PartnerFinancialRow } from '@/lib/deliveryPartnerRepository';

export default function PartnerFinancials() {
  const [rows, setRows] = useState<PartnerFinancialRow[] | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchPartnerFinancials().then(data => { if (alive) setRows(data); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Could not load partner finances.'); });
    return () => { alive = false; };
  }, [reload]);
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!rows) return <p className="text-sm text-navy-600">Loading partner financial records...</p>;
  const naira = (kobo: number) => formatNaira(Number(kobo || 0) / 100);
  const totalCollected = rows.reduce((sum, p) => sum + p.collections.reduce((s, c) => s + Number(c.amount_collected_kobo), 0), 0);
  const totalRemitted = rows.reduce((sum, p) => sum + p.collections.reduce((s, c) => s + Number(c.remitted_amount_kobo), 0), 0);
  return <section className="flex flex-col gap-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Recorded collections</p><p className="mt-1 text-xl font-extrabold text-navy-900">{naira(totalCollected)}</p></div>
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Verified remittances</p><p className="mt-1 text-xl font-extrabold text-navy-900">{naira(totalRemitted)}</p></div>
      <div className="rounded-2xl border border-navy-100 bg-white p-4"><p className="text-xs text-navy-500">Outstanding balance</p><p className="mt-1 text-xl font-extrabold text-red-600">{naira(totalCollected-totalRemitted)}</p></div>
    </div>
    <p className="text-sm leading-relaxed text-navy-600">Amounts below are administrative records, not live bank balances. Confirm collections and remittances against your bank statement before treating them as received.</p>
    {rows.map(partner => {
      const collected = partner.collections.reduce((s,c)=>s+Number(c.amount_collected_kobo),0);
      const remitted = partner.collections.reduce((s,c)=>s+Number(c.remitted_amount_kobo),0);
      return <article key={partner.id} className="rounded-2xl border border-navy-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold text-navy-900">{partner.full_name}</h2><p className="text-sm text-navy-600">{partner.whatsapp} · {partner.active ? 'Active' : 'Paused'}</p></div><span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700">{partner.collections.length} recorded collections</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-navy-500">Collected</p><p className="font-bold">{naira(collected)}</p></div><div><p className="text-xs text-navy-500">Remitted</p><p className="font-bold">{naira(remitted)}</p></div><div><p className="text-xs text-navy-500">Outstanding</p><p className="font-bold text-red-600">{naira(collected-remitted)}</p></div></div>
        <div className="mt-4 rounded-xl bg-mist p-4"><h3 className="text-xs font-extrabold uppercase tracking-wide text-navy-600">Partner bank details</h3><p className="mt-2 text-sm"><b>Bank:</b> {partner.bank_name || 'Not provided'}</p><p className="text-sm"><b>Account name:</b> {partner.bank_account_name || 'Not provided'}</p><p className="text-sm"><b>Account number:</b> {partner.bank_account_number || 'Not provided'}</p></div>
        {partner.collections.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-navy-500"><th className="py-2">Date</th><th>Method</th><th>Collected</th><th>Remitted</th><th>Reference</th></tr></thead><tbody>{partner.collections.map(c=><tr key={c.id} className="border-b border-navy-50"><td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td><td>{c.collection_method.replaceAll('_',' ')}</td><td>{naira(c.amount_collected_kobo)}</td><td>{naira(c.remitted_amount_kobo)}</td><td>{c.collection_reference || '—'}</td></tr>)}</tbody></table></div>}
      </article>;
    })}
    <button type="button" onClick={()=>setReload(v=>v+1)} className="self-start rounded-full border border-navy-200 px-4 py-2 text-sm font-bold text-navy-800">Refresh records</button>
  </section>;
}
