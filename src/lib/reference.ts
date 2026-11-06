const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(length: number): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('');
}

export function generateReference(kind: 'BLK' | 'IND'): string {
  return `DPC-${kind}-${randomChunk(4)}-${randomChunk(6)}`;
}
