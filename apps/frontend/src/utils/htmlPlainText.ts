export function htmlToPlainText(html: string): string {
  const raw = String(html ?? '');
  if (typeof document !== 'undefined') {
    const d = document.createElement('div');
    d.innerHTML = raw;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
