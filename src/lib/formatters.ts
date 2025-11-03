/**
 * Format number with thousand separator (Indonesian format: 1.000.000)
 * @param value - Number or string to format
 * @returns Formatted string with dots as thousand separators
 */
export function formatThousandSeparator(value: number | string): string {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove any non-digit characters
  const numStr = String(value).replace(/\D/g, '');
  
  if (!numStr) return '';
  
  // Add thousand separators (dots)
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse formatted string back to number
 * @param value - Formatted string with thousand separators
 * @returns Number value
 */
export function parseThousandSeparator(value: string): number {
  if (!value) return 0;
  
  // Remove dots and parse as integer
  const numStr = value.replace(/\./g, '');
  return parseInt(numStr, 10) || 0;
}

/**
 * Handle input change for currency fields
 * @param value - Input value
 * @param setValue - State setter function
 */
export function handleCurrencyInput(
  value: string,
  setValue: (value: string) => void
): void {
  // Remove all non-digit characters
  const numericValue = value.replace(/\D/g, '');
  
  // Format with thousand separators
  const formatted = formatThousandSeparator(numericValue);
  
  setValue(formatted);
}
