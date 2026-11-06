import { getSupabase } from '@/lib/supabase';
import { isNigerianMobile, normalizePhone } from '@/lib/phone';

export const ENQUIRY_CATEGORIES = [
  'General question',
  'Order enquiry',
  'Pricing',
  'Delivery',
  'Complaint',
  'Other',
] as const;

export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];
export type EnquiryStatus = 'unanswered' | 'answered';
export type EnquiryFilter = 'all' | 'unanswered' | 'answered' | 'archived';

export interface EnquiryDraft {
  customerName: string;
  phone: string;
  email: string;
  category: EnquiryCategory | '';
  orderReference: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryDraft, string>>;

export interface EnquiryRow {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  category: EnquiryCategory;
  order_reference: string | null;
  message: string;
  status: EnquiryStatus;
  archived_at: string | null;
  created_at: string;
}

export interface EnquiryReply {
  id: string;
  body: string;
  created_at: string;
}

const ORDER_REFERENCE_PATTERN = /^DPC-(IND|BLK)-[A-Z0-9]{4}-[A-Z0-9]{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(draft: EnquiryDraft): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = draft.customerName.trim();
  const message = draft.message.trim();
  const email = draft.email.trim();
  const orderReference = draft.orderReference.trim().toUpperCase();

  if (name.length < 2) errors.customerName = 'Enter your name.';
  if (!isNigerianMobile(draft.phone)) errors.phone = 'Enter a valid Nigerian mobile number.';
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) errors.email = 'Enter a valid email address.';
  if (!draft.category) errors.category = 'Choose what your message is about.';
  if (orderReference && !ORDER_REFERENCE_PATTERN.test(orderReference)) {
    errors.orderReference = 'Use the reference from your order, for example DPC-IND-AB12-CD34EF.';
  }
  if (message.length < 10) errors.message = 'Write at least 10 characters so we can help.';
  if (message.length > 2000) errors.message = 'Keep your message under 2000 characters.';

  return errors;
}

function toLocalPhone(value: string): string {
  return normalizePhone(value).replace(/^\+?234/, '0');
}

export async function submitEnquiry(draft: EnquiryDraft): Promise<void> {
  const email = draft.email.trim();
  const orderReference = draft.orderReference.trim().toUpperCase();
  const { error } = await getSupabase().from('website_enquiries').insert({
    customer_name: draft.customerName.trim(),
    phone: toLocalPhone(draft.phone),
    email: email || null,
    category: draft.category,
    order_reference: orderReference || null,
    message: draft.message.trim(),
  });

  if (error) throw new Error('Your message could not be sent. Please try again or message us on WhatsApp.');
}

export async function fetchEnquiries(filter: EnquiryFilter): Promise<EnquiryRow[]> {
  let query = getSupabase()
    .from('website_enquiries')
    .select('id, customer_name, phone, email, category, order_reference, message, status, archived_at, created_at')
    .order('created_at', { ascending: false });

  if (filter === 'archived') {
    query = query.not('archived_at', 'is', null);
  } else {
    query = query.is('archived_at', null);
    if (filter === 'unanswered' || filter === 'answered') query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) throw new Error('Messages could not be loaded.');
  return (data ?? []) as EnquiryRow[];
}

export async function fetchUnansweredCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from('website_enquiries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'unanswered')
    .is('archived_at', null);

  if (error) throw new Error('The unanswered count could not be loaded.');
  return count ?? 0;
}

export async function fetchEnquiryReplies(enquiryId: string): Promise<EnquiryReply[]> {
  const { data, error } = await getSupabase()
    .from('enquiry_replies')
    .select('id, body, created_at')
    .eq('enquiry_id', enquiryId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Replies could not be loaded.');
  return (data ?? []) as EnquiryReply[];
}

export async function replyToEnquiry(enquiryId: string, body: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_reply_to_enquiry', {
    p_enquiry_id: enquiryId,
    p_body: body.trim(),
  });

  if (error) throw new Error(error.message || 'The reply could not be saved.');
}

export async function setEnquiryStatus(enquiryId: string, status: EnquiryStatus): Promise<void> {
  const { data, error } = await getSupabase()
    .from('website_enquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enquiryId)
    .select('id');

  if (error || !data || data.length === 0) throw new Error('The enquiry status could not be updated.');
}

export async function setEnquiryArchived(enquiryId: string, archived: boolean): Promise<void> {
  const { data, error } = await getSupabase()
    .from('website_enquiries')
    .update({ archived_at: archived ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', enquiryId)
    .select('id');

  if (error || !data || data.length === 0) throw new Error('The enquiry could not be updated.');
}
