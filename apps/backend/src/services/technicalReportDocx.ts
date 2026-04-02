// docx ships a root types entry that conflicts with `file.d.ts` vs `file/index` resolution; runtime exports are correct.
// @ts-nocheck

import sharp from 'sharp';
import { htmlToPlainText } from '../utils/htmlPlainText.js';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LineRuleType,
  Packer,
  PageBorderDisplay,
  PageBorderOffsetFrom,
  PageBorderZOrder,
  Paragraph,
  Table,
  TableBorders,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalAlign,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';

export interface TechnicalReportLine {
  name: string;
  total: number;
}

export interface TechnicalReportDocxInput {
  /** Customer tracking code (shown in header; not internal order number). */
  trackingCode: string;
  brand: string;
  model: string;
  series: string;
  type: string;
  equipmentCondition: string;
  technicalReport: string;
  budgetLines: TechnicalReportLine[];
  technicianName: string;
  companyName: string;
  logoBuffer: Buffer | null;
  /** Optional intake / before-repair photos (resolved server-side). */
  photoBeforeBuffers?: Buffer[] | null;
  /** Optional after-repair photos (resolved server-side). */
  photoAfterBuffers?: Buffer[] | null;
}

export function isOrderEligibleForTechnicalReport(o: { area?: string; state?: string }): boolean {
  const s = String(o.state ?? '');
  const a = String(o.area ?? '');
  return s === 'warehouse' || s === 'delivery' || s === 'finished' || a === 'warehouse';
}

function fmtMoney(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
}

function nonEmpty(s: string, fallback: string): string {
  const t = String(s ?? '').trim();
  return t || fallback;
}

const NO_CELL_BORDER = {
  top: { style: BorderStyle.NONE, size: 1, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 1, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 1, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 1, color: 'FFFFFF' },
} as const;

/** docx `size` is half-points (e.g. 26 → 13pt). */
const FONT = 'Arial';
/** Distinct face for the budget / pricing block (contrasts with narrative body). */
const FONT_PRICING = 'Calibri';
const SZ = {
  header: 30,
  title: 48,
  body: 26,
  table: 24,
  footer: 24,
  watermarkText: 88,
} as const;

const bodySpacing = { after: 180, line: 276, lineRule: LineRuleType.AUTO as const };

/** Same logo as header, scaled down in opacity so it reads as a watermark on the page. */
const WATERMARK_ALPHA = 0.2;

/** Header logo size (px); watermark keeps the same aspect ratio, larger on the page. */
const LOGO_HEADER_W = 168;
const LOGO_HEADER_H = 84;
const LOGO_WATERMARK_W = 600;
const LOGO_WATERMARK_H = 300;

/** Max dimensions (px) for each photo in the two-column evidence block. */
const PHOTO_DOC_MAX_W = 280;
const PHOTO_DOC_MAX_H = 260;

async function fitImageBufferForDocx(
  buf: Buffer,
  maxW: number,
  maxH: number
): Promise<{ data: Buffer; width: number; height: number } | null> {
  try {
    const { data, info } = await sharp(buf)
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    const w = info.width ?? maxW;
    const h = info.height ?? maxH;
    if (!w || !h) return null;
    return { data, width: w, height: h };
  } catch {
    return null;
  }
}

async function bufferAsFadedWatermark(buf: Buffer): Promise<Buffer> {
  try {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.channels !== 4) {
      return buf;
    }
    const out = Buffer.from(data);
    const factor = WATERMARK_ALPHA;
    for (let i = 3; i < out.length; i += 4) {
      out[i] = Math.min(255, Math.round(out[i] * factor));
    }
    return sharp(out, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();
  } catch {
    return buf;
  }
}

export async function buildTechnicalReportDocxBuffer(input: TechnicalReportDocxInput): Promise<Buffer> {
  const {
    trackingCode,
    brand,
    model,
    series,
    type,
    equipmentCondition,
    technicalReport,
    budgetLines,
    technicianName,
    companyName,
    logoBuffer,
    photoBeforeBuffers = null,
    photoAfterBuffers = null,
  } = input;

  const seriesPart = String(series ?? '').trim() ? ` serie ${String(series).trim()}` : '';
  const p1 = `Equipo ${nonEmpty(brand, '—')} ${nonEmpty(model, '')}${seriesPart} ingresa para ${nonEmpty(type, 'servicio técnico')}.`
    .replace(/\s+/g, ' ')
    .trim();
  const p2 = `Cliente indica que ${nonEmpty(htmlToPlainText(equipmentCondition), 'se autoriza el servicio según cotización.')}`;
  const p3 = nonEmpty(htmlToPlainText(technicalReport), '—');
  const p4 = 'Se recomienda mantenimiento preventivo 1 vez al año.';

  const beforeBuffersRaw = (photoBeforeBuffers ?? []).filter((b) => b && b.length > 0);
  const afterBuffersRaw = (photoAfterBuffers ?? []).filter((b) => b && b.length > 0);
  const beforeFits: { data: Buffer; width: number; height: number }[] = [];
  const afterFits: { data: Buffer; width: number; height: number }[] = [];
  try {
    for (const buf of beforeBuffersRaw) {
      const fit = await fitImageBufferForDocx(buf, PHOTO_DOC_MAX_W, PHOTO_DOC_MAX_H);
      if (fit) beforeFits.push(fit);
    }
    for (const buf of afterBuffersRaw) {
      const fit = await fitImageBufferForDocx(buf, PHOTO_DOC_MAX_W, PHOTO_DOC_MAX_H);
      if (fit) afterFits.push(fit);
    }
  } catch {
    beforeFits.length = 0;
    afterFits.length = 0;
  }
  /** Only show the block when Sharp produced at least one valid raster (skip bad/missing files). */
  const showPhotoBlock = beforeFits.length > 0 || afterFits.length > 0;

  const photoColumnParagraphs = (
    fits: { data: Buffer; width: number; height: number }[]
  ): Paragraph[] => {
    if (fits.length === 0) {
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
          children: [
            new TextRun({
              text: 'Sin imagen',
              italics: true,
              font: FONT,
              size: 22,
              color: '888888',
            }),
          ],
        }),
      ];
    }
    return fits.map((fit, idx) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: idx < fits.length - 1 ? 200 : 320 },
        children: [
          new ImageRun({
            data: fit.data,
            transformation: { width: fit.width, height: fit.height },
          }),
        ],
      })
    );
  };

  const watermarkLogoBuffer = logoBuffer != null ? await bufferAsFadedWatermark(logoBuffer) : null;

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [5500, 3500],
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: logoBuffer
                  ? [
                      new ImageRun({
                        data: logoBuffer,
                        transformation: { width: LOGO_HEADER_W, height: LOGO_HEADER_H },
                      }),
                    ]
                  : [
                      new TextRun({
                        text: companyName,
                        bold: true,
                        font: FONT,
                        size: SZ.header,
                        color: 'C00000',
                      }),
                    ],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `#${nonEmpty(trackingCode, '—')}`,
                    bold: true,
                    font: FONT,
                    size: SZ.header,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const docHeader = new Header({
    children: [headerTable],
  });

  const docFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: 'TECNICO RESPONSABLE:',
            bold: true,
            font: FONT,
            color: 'C00000',
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `Tec. ${technicianName} `,
            bold: true,
            font: FONT,
            size: SZ.footer,
          }),
          new TextRun({
            text: '____________________',
            bold: true,
            font: FONT,
            size: SZ.footer,
          }),
        ],
      }),
    ],
  });

  const watermarkParagraphs: Paragraph[] =
    logoBuffer != null && watermarkLogoBuffer != null
      ? [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new ImageRun({
                data: watermarkLogoBuffer,
                transformation: { width: LOGO_WATERMARK_W, height: LOGO_WATERMARK_H },
                floating: {
                  horizontalPosition: {
                    relative: HorizontalPositionRelativeFrom.PAGE,
                    align: HorizontalPositionAlign.CENTER,
                  },
                  verticalPosition: {
                    relative: VerticalPositionRelativeFrom.PAGE,
                    align: VerticalPositionAlign.CENTER,
                  },
                  behindDocument: true,
                  allowOverlap: true,
                  wrap: { type: TextWrappingType.NONE },
                },
              }),
            ],
          }),
        ]
      : [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: companyName.toUpperCase(),
                font: FONT,
                size: SZ.watermarkText,
                color: 'DDDDDD',
              }),
            ],
          }),
        ];

  const bodyChildren: (Paragraph | Table)[] = [
    ...watermarkParagraphs,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 320 },
      children: [
        new TextRun({
          text: 'REPORTE TECNICO',
          bold: true,
          font: FONT,
          size: SZ.title,
          color: 'C00000',
          characterSpacing: 24,
        }),
      ],
    }),
    new Paragraph({
      spacing: bodySpacing,
      children: [new TextRun({ text: p1, font: FONT, size: SZ.body, bold: true })],
    }),
    new Paragraph({
      spacing: bodySpacing,
      children: [new TextRun({ text: p2, font: FONT, size: SZ.body, bold: true })],
    }),
    new Paragraph({
      spacing: bodySpacing,
      children: [new TextRun({ text: p3, font: FONT, size: SZ.body, bold: true })],
    }),
    new Paragraph({
      spacing: { ...bodySpacing, after: 320 },
      children: [new TextRun({ text: p4, font: FONT, size: SZ.body, bold: true })],
    }),
  ];

  const lineRows =
    budgetLines.length > 0
      ? budgetLines.map(
          (line) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: NO_CELL_BORDER,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: line.name || '—', size: 22 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: NO_CELL_BORDER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { line: 276, lineRule: LineRuleType.AUTO },
                      children: [
                        new TextRun({
                          text: fmtMoney(line.total),
                          bold: true,
                          font: FONT_PRICING,
                          size: SZ.table,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                borders: NO_CELL_BORDER,
                children: [
                  new Paragraph({
                    spacing: { line: 276, lineRule: LineRuleType.AUTO },
                    children: [
                      new TextRun({
                        text: 'Servicios / repuestos',
                        italics: true,
                        font: FONT,
                        size: SZ.table,
                        color: '666666',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: NO_CELL_BORDER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { line: 276, lineRule: LineRuleType.AUTO },
                    children: [
                      new TextRun({ text: '—', bold: true, font: FONT_PRICING, size: SZ.table }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ];

  bodyChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [6500, 2500],
      borders: TableBorders.NONE,
      rows: lineRows,
    })
  );

  if (showPhotoBlock) {
    bodyChildren.push(
      new Paragraph({
        spacing: { before: 360, after: 160 },
        children: [
          new TextRun({
            text: 'Evidencia fotográfica',
            bold: true,
            font: FONT,
            size: SZ.body,
            color: 'C00000',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [4500, 4500],
        borders: TableBorders.NONE,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                borders: NO_CELL_BORDER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: 'Antes de reparación',
                        bold: true,
                        font: FONT,
                        size: 22,
                        color: '333333',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                borders: NO_CELL_BORDER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: 'Después de reparación',
                        bold: true,
                        font: FONT,
                        size: 22,
                        color: '333333',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                verticalAlign: VerticalAlign.TOP,
                borders: NO_CELL_BORDER,
                children: photoColumnParagraphs(beforeFits),
              }),
              new TableCell({
                verticalAlign: VerticalAlign.TOP,
                borders: NO_CELL_BORDER,
                children: photoColumnParagraphs(afterFits),
              }),
            ],
          }),
        ],
      })
    );
  }

  const doc = new Document({
    title: 'Reporte técnico',
    creator: companyName,
    sections: [
      {
        headers: { default: docHeader },
        footers: { default: docFooter },
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                offsetFrom: PageBorderOffsetFrom.PAGE,
                zOrder: PageBorderZOrder.FRONT,
              },
              pageBorderTop: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              pageBorderRight: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              pageBorderBottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              pageBorderLeft: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
          },
        },
        children: bodyChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
