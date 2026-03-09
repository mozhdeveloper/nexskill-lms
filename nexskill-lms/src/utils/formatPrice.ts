/**
 * Format a number as Philippine Peso (₱).
 * Examples: formatPrice(1234.5) → "₱1,234.50", formatPrice(0) → "₱0.00"
 */
export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Compact format for large amounts (e.g. ₱12.3K, ₱1.5M)
 */
export function formatPriceCompact(amount: number): string {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`;
  return formatPrice(amount);
}
