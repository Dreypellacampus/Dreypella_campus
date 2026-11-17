import { useState, type FormEvent } from 'react';
import type { DeliveryPartner } from '@/lib/deliveryPartnerRepository';
import { updateOwnPartnerBankDetails } from '@/lib/deliveryPartnerRepository';
import Button from '@/components/ui/Button';

const INPUT='w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100';

export default function PartnerBankDetails({ partner }: { partner: DeliveryPartner }) {
  const [bank,setBank]=useState(partner.bank_name ?? '');
  const [name,setName]=useState(partner.bank_account_name ?? '');
  const [number,setNumber]=useState(partner.bank_account_number ?? '');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');setNotice('');
    if(bank.trim().length<2||name.trim().length<2||!/^\d{10,30}$/.test(number.trim())){setError('Enter a bank name, account name and valid account number.');return;}
    setBusy(true);
    try{await updateOwnPartnerBankDetails({bank_name:bank.trim(),bank_account_name:name.trim(),bank_account_number:number.trim()});setNotice('Your payout bank details have been saved.');}
    catch(e){setError(e instanceof Error?e.message:'Could not save bank details.');}
    finally{setBusy(false);}
  };
  return <section className="rounded-2xl border border-navy-100 bg-white p-5">
    <h2 className="text-lg font-extrabold text-navy-900">Your payout bank details</h2>
    <p className="mt-1 text-sm text-navy-600">Enter the account Dreypella should use when paying your delivery earnings. Only you and authorised main administrators can access these details.</p>
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">Bank name<input className={INPUT} value={bank} onChange={e=>setBank(e.target.value)} autoComplete="organization" required maxLength={100}/></label>
      <label className="flex flex-col gap-1 text-sm font-semibold">Account name<input className={INPUT} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required maxLength={150}/></label>
      <label className="flex flex-col gap-1 text-sm font-semibold">Account number<input className={INPUT} value={number} onChange={e=>setNumber(e.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="off" required minLength={10} maxLength={30}/></label>
      <div className="sm:col-span-3 flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy} className="px-5 py-2.5 text-sm">{busy?'Saving...':'Save bank details'}</Button>{notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}</div>
    </form>
  </section>;
}
