import DOMPurify from 'dompurify';
import { htmlToPlainText } from '../../utils/htmlPlainText';

type Props = {
  html: string;
  className?: string;
};

const richBodyClass =
  'text-sm text-slate-600 dark:text-slate-600 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline';

export function RichTextHtml({ html, className }: Props) {
  const raw = String(html ?? '');
  const safe = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  if (!htmlToPlainText(safe)) return null;
  return (
    <div
      className={`${richBodyClass} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
