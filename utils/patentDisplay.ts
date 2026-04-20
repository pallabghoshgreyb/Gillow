export const hasText = (value?: string | null): boolean => Boolean(value && value.trim());

export const hasItems = (items?: string[] | null): boolean =>
  Array.isArray(items) && items.some((item) => hasText(item));

export const isKnownNumber = (value?: number | null): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value?: number | null): string => {
  if (!isKnownNumber(value)) return 'Not listed';
  return compactCurrencyFormatter.format(value);
};
