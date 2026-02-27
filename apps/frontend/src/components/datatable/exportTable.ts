import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { TableColumn } from 'react-data-table-component';

export interface ExportTableOptions {
  /** Title shown on PDF (and used for sheet name in Excel) */
  title?: string;
  /** Filename without extension (e.g. "agenda-items") */
  filename?: string;
  /** PDF head row fill color [r, g, b]. Default blue. */
  headFillColor?: [number, number, number];
}

function getRowValues<T>(row: T, columns: TableColumn<T>[]): string[] {
  return columns.map((col) => {
    const val = col.selector ? (col.selector as (r: T) => unknown)(row) : '';
    return String(val ?? '');
  });
}

/**
 * Export table data to PDF using current columns and data.
 */
export function exportTableToPDF<T>(
  columns: TableColumn<T>[],
  data: T[],
  options: ExportTableOptions = {}
): void {
  const { title = 'Export', filename = 'export', headFillColor = [37, 99, 235] } = options;
  const doc = new jsPDF();
  doc.text(title, 14, 20);
  autoTable(doc, {
    head: [columns.map((c) => (c.name as string) || '')],
    body: data.map((row) => getRowValues(row, columns)),
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: headFillColor },
  });
  doc.save(`${filename}.pdf`);
}

/**
 * Export table data to Excel using current columns and data.
 */
export function exportTableToExcel<T>(
  columns: TableColumn<T>[],
  data: T[],
  options: ExportTableOptions = {}
): void {
  const { title = 'Export', filename = 'export' } = options;
  const wsData = [
    columns.map((c) => (c.name as string) || ''),
    ...data.map((row) => getRowValues(row, columns)),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)); // sheet name max 31 chars
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export table data to CSV (download).
 */
export function exportTableToCSV<T>(
  columns: TableColumn<T>[],
  data: T[],
  options: ExportTableOptions = {}
): void {
  const { filename = 'export' } = options;
  const escape = (v: string) => {
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape((c.name as string) || '')).join(',');
  const rows = data.map((row) => getRowValues(row, columns).map(escape).join(','));
  const csv = [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
