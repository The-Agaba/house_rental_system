export const formatTzs = (value) => {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `TZS ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(safeValue)}`;
};
