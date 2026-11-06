import { getSupabase } from '@/lib/supabase';

export interface PriceItem {
  id: string;
  name: string;
  unit_price: number;
}

export interface PriceItemInput {
  name: string;
  unit_price: number;
}

const DUPLICATE_NAME_CODE = '23505';

function saveErrorMessage(code: string | undefined): string {
  return code === DUPLICATE_NAME_CODE
    ? 'An item with this name already has a price.'
    : 'The price could not be saved.';
}

export async function fetchPriceItems(): Promise<PriceItem[]> {
  const { data, error } = await getSupabase()
    .from('price_items')
    .select('id, name, unit_price')
    .order('name', { ascending: true });

  if (error) throw new Error('Prices could not be loaded.');
  return (data ?? []) as PriceItem[];
}

export async function createPriceItem(input: PriceItemInput): Promise<void> {
  const { error } = await getSupabase().from('price_items').insert(input);
  if (error) throw new Error(saveErrorMessage(error.code));
}

export async function updatePriceItem(id: string, input: PriceItemInput): Promise<void> {
  const { data, error } = await getSupabase()
    .from('price_items')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  if (error) throw new Error(saveErrorMessage(error.code));
  if (!data || data.length === 0) throw new Error('The price could not be saved.');
}

export async function deletePriceItem(id: string): Promise<void> {
  const { data, error } = await getSupabase().from('price_items').delete().eq('id', id).select('id');
  if (error) throw new Error('The price could not be removed.');
  if (!data || data.length === 0) throw new Error('The price could not be removed.');
}
