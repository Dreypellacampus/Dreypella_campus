import type { PriceItem } from '@/lib/priceRepository';

interface PricedItem {
  name: string;
  quantity: number;
}

export function priceLineItems(items: ReadonlyArray<PricedItem>, prices: ReadonlyArray<PriceItem>) {
  const lines = items.map((item) => {
    const entry = prices.find(
      (price) => price.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    return {
      unitPrice: entry?.unit_price ?? null,
      subtotal: entry ? entry.unit_price * item.quantity : null,
    };
  });

  const total =
    lines.length > 0 && lines.every((line) => line.subtotal !== null)
      ? lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0)
      : null;

  return { lines, total };
}
