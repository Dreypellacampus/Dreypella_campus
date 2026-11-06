export interface BuyItem {
  name: string;
  quantity: string;
}

export const EMPTY_BUY_ITEM: BuyItem = { name: '', quantity: '' };

export function serializeBuyItems(items: BuyItem[]): string {
  return items
    .filter((item) => item.name.trim())
    .map((item) => `${item.quantity.trim() || '1'} x ${item.name.trim()}`)
    .join('\n');
}

export function countBuyItems(items: BuyItem[]): number {
  return items.filter((item) => item.name.trim()).length;
}
