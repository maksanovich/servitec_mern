import PDFDocument from 'pdfkit';
import { parse, type HTMLElement, type Node, type TextNode } from 'node-html-parser';

type PdfDoc = InstanceType<typeof PDFDocument>;

type Run = { text: string; bold: boolean; italic: boolean };

const INLINE_SKIP = new Set(['script', 'style']);

function sanitize(html: string): string {
  return String(html ?? '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

function mergeRuns(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (last && last.bold === r.bold && last.italic === r.italic) {
      last.text += r.text;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

function collectRuns(node: Node, inherited: { bold: boolean; italic: boolean }): Run[] {
  if (node.nodeType === 3) {
    const t = (node as TextNode).text;
    if (!t) return [];
    return [{ text: t, bold: inherited.bold, italic: inherited.italic }];
  }
  if (node.nodeType !== 1) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (INLINE_SKIP.has(tag)) return [];
  if (tag === 'br') return [{ text: '\n', bold: inherited.bold, italic: inherited.italic }];

  const next = { ...inherited };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italic = true;

  const parts: Run[] = [];
  for (const ch of el.childNodes) {
    parts.push(...collectRuns(ch, next));
  }
  return mergeRuns(parts);
}

function pickFont(r: Run): string {
  if (r.bold && r.italic) return 'Helvetica-BoldOblique';
  if (r.bold) return 'Helvetica-Bold';
  if (r.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

function drawRuns(
  doc: PdfDoc,
  runs: Run[],
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  fillColor: string
): number {
  const flat = mergeRuns(runs).filter((r) => r.text.length > 0);
  if (flat.length === 0) return y;
  doc.fontSize(fontSize).fillColor(fillColor);
  for (let i = 0; i < flat.length; i += 1) {
    doc.font(pickFont(flat[i]));
    doc.text(flat[i].text, i === 0 ? x : undefined, i === 0 ? y : undefined, {
      width,
      lineGap,
      continued: i < flat.length - 1,
    });
  }
  return doc.y;
}

function inlineRunsFromElement(el: HTMLElement): Run[] {
  return mergeRuns(collectRuns(el, { bold: false, italic: false }));
}

function renderOl(
  doc: PdfDoc,
  el: HTMLElement,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  fillColor: string
): number {
  let cy = y;
  let index = 0;
  for (const child of el.childNodes) {
    if (child.nodeType !== 1) continue;
    if ((child as HTMLElement).tagName.toLowerCase() !== 'li') continue;
    index += 1;
    cy = renderLi(
      doc,
      child as HTMLElement,
      `${index}. `,
      x,
      cy,
      width,
      fontSize,
      lineGap,
      fillColor
    );
  }
  return cy + 4;
}

function renderUl(
  doc: PdfDoc,
  el: HTMLElement,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  fillColor: string
): number {
  let cy = y;
  for (const child of el.childNodes) {
    if (child.nodeType !== 1) continue;
    if ((child as HTMLElement).tagName.toLowerCase() !== 'li') continue;
    cy = renderLi(doc, child as HTMLElement, '• ', x, cy, width, fontSize, lineGap, fillColor);
  }
  return cy + 4;
}

function renderLi(
  doc: PdfDoc,
  li: HTMLElement,
  prefix: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  fillColor: string
): number {
  let cy = y;
  let first = true;
  const pad = ' '.repeat(Math.max(prefix.length, 2));

  for (const child of li.childNodes) {
    if (child.nodeType === 3) {
      const raw = (child as TextNode).text;
      if (!raw.trim()) continue;
      const runs = mergeRuns([{ text: first ? prefix : pad, bold: false, italic: false }, ...collectRuns(child, { bold: false, italic: false })]);
      cy = drawRuns(doc, runs, x, cy, width, fontSize, lineGap, fillColor);
      cy += 4;
      first = false;
      continue;
    }
    if (child.nodeType !== 1) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'ol') {
      cy = renderOl(doc, el, x + 12, cy, width - 12, fontSize, lineGap, fillColor);
      first = false;
    } else if (tag === 'ul') {
      cy = renderUl(doc, el, x + 12, cy, width - 12, fontSize, lineGap, fillColor);
      first = false;
    } else if (tag === 'p' || tag === 'div') {
      const inner = inlineRunsFromElement(el);
      if (!mergeRuns(inner).some((r) => r.text.trim())) continue;
      const head: Run[] = first
        ? [{ text: prefix, bold: false, italic: false }, ...inner]
        : [{ text: pad, bold: false, italic: false }, ...inner];
      cy = drawRuns(doc, mergeRuns(head), x, cy, width, fontSize, lineGap, fillColor);
      cy += 6;
      first = false;
    } else if (!INLINE_SKIP.has(tag)) {
      const inner = inlineRunsFromElement(el);
      if (!mergeRuns(inner).some((r) => r.text.trim())) continue;
      const head: Run[] = first
        ? [{ text: prefix, bold: false, italic: false }, ...inner]
        : [{ text: pad, bold: false, italic: false }, ...inner];
      cy = drawRuns(doc, mergeRuns(head), x, cy, width, fontSize, lineGap, fillColor);
      cy += 4;
      first = false;
    }
  }

  if (first) {
    doc.fontSize(fontSize).font('Helvetica').fillColor(fillColor);
    doc.text(`${prefix.trimEnd()} `, x, cy, { width, lineGap });
    cy = doc.y + 4;
  }

  return cy;
}

function renderBlockNodes(
  doc: PdfDoc,
  nodes: Node[],
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  fillColor: string
): number {
  let cy = y;
  for (const node of nodes) {
    if (node.nodeType === 3) {
      const t = (node as TextNode).text.trim();
      if (!t) continue;
      const runs = collectRuns(node, { bold: false, italic: false });
      cy = drawRuns(doc, runs, x, cy, width, fontSize, lineGap, fillColor);
      cy += 6;
      continue;
    }
    if (node.nodeType !== 1) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (INLINE_SKIP.has(tag)) continue;

    if (tag === 'ol') {
      cy = renderOl(doc, el, x, cy, width, fontSize, lineGap, fillColor);
    } else if (tag === 'ul') {
      cy = renderUl(doc, el, x, cy, width, fontSize, lineGap, fillColor);
    } else if (tag === 'p' || tag === 'div') {
      const runs = inlineRunsFromElement(el);
      if (!mergeRuns(runs).some((r) => r.text.trim())) continue;
      cy = drawRuns(doc, runs, x, cy, width, fontSize, lineGap, fillColor);
      cy += 8;
    } else if (tag === 'br') {
      cy += fontSize * 0.45;
    } else {
      cy = renderBlockNodes(doc, el.childNodes, x, cy, width, fontSize, lineGap, fillColor);
    }
  }
  return cy;
}

/**
 * Renders a small subset of HTML (from the rich-text editor) into the current PDF page stream.
 * Supports paragraphs, ordered/unordered lists, line breaks, bold/italic, and nested lists.
 */
export function drawHtmlToPdfKit(
  doc: PdfDoc,
  html: string,
  x: number,
  y: number,
  width: number,
  options?: { fontSize?: number; lineGap?: number; fillColor?: string }
): number {
  const fontSize = options?.fontSize ?? 8;
  const lineGap = options?.lineGap ?? 2;
  const fillColor = options?.fillColor ?? '#111827';

  const raw = sanitize(html).trim();
  if (!raw) {
    doc.fontSize(fontSize).font('Helvetica').fillColor(fillColor);
    doc.text('—', x, y, { width, lineGap });
    return doc.y + 4;
  }

  const root = parse(raw);
  const cy = renderBlockNodes(doc, root.childNodes, x, y, width, fontSize, lineGap, fillColor);
  return cy;
}
