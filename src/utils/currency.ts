/**
 * Currency utility for Indian Rupee (INR / ₹) formatting.
 * Complies with Indian numbering format (Lakhs, Crores, Thousands).
 */

export function formatINR(
  amount: number | null | undefined,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const { showDecimals = false, compact = false } = options || {};

  if (compact && Math.abs(amount) >= 100000) {
    if (Math.abs(amount) >= 10000000) {
      // Crores
      const val = parseFloat((amount / 10000000).toFixed(2));
      return `₹${val} Cr`;
    }
    // Lakhs
    const val = parseFloat((amount / 100000).toFixed(2));
    return `₹${val} L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function parseINR(value: string): number {
  if (!value) return 0;
  // Remove currency symbol, commas, and whitespace
  const sanitized = value.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
