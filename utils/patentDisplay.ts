export const hasText = (value?: string | null): boolean => {
  if (!value) return false;
  const normalized = value.trim();
  return Boolean(normalized && normalized !== '-' && normalized !== '—' && normalized !== 'â€”');
};

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
