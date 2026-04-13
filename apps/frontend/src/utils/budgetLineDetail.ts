/** Strip leading id/code prefixes from budget line detail text (matches public track display). */
export function cleanBudgetLineDetail(detail?: string): string {
  if (!detail?.trim()) return '';
  const text = detail.trim();
  const withoutIdPrefix = text.replace(/^\s*(?:id|codigo|c[oó]digo)\s*[:#-]?\s*\S+\s*(?:\||-|,)\s*/i, '');
  const withoutIdOnly = withoutIdPrefix.replace(/^\s*(?:id|codigo|c[oó]digo)\s*[:#-]?\s*/i, '').trim();
  return withoutIdOnly;
}
