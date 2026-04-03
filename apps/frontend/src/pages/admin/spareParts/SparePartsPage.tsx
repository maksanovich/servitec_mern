import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Home, FileText, FileSpreadsheet } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, Loader, Modal } from '../../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../../components/datatable';
import { useAuth } from '../../../contexts/AuthContext';
import { getSpareServerCatalog, type SpareServerRow } from '../../../api/spareServer';
import { spareAllTariffPrices } from '../../../utils/spareTariffPrice';
import { formatDate, formatPrice, sparePartsColumns, SparePartThumbnail } from './sparePartsColumns';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-3 gap-y-1 py-2 border-b border-slate-100 dark:border-slate-700 text-sm">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <div className="text-slate-900 dark:text-slate-100 break-words min-w-0">{children}</div>
    </div>
  );
}

const exportOptions = { title: 'Spare Parts (Perseo)', filename: 'spare-server-catalog' };

export function SparePartsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<SpareServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const filteredDataRef = useRef<SpareServerRow[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SpareServerRow | null>(null);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: SpareServerRow[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { items: list } = await getSpareServerCatalog(token);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openDetail = useCallback((row: SpareServerRow) => {
    setSelectedRow(row);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedRow(null);
  }, []);

  const exportPDF = () => exportTableToPDF(sparePartsColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(sparePartsColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Spare Parts - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[{ label: 'Catalog & Finance', icon: Home }, { label: 'Spare Parts' }]}
      />

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Catalog synced from Perseo (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">SpareServer</code>
        ). Updated on the hourly sync job.
      </p>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<SpareServerRow>
          data={items}
          columns={sparePartsColumns}
          searchFields={['productocodigo', 'description', 'productosid']}
          searchPlaceholder="Look for:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          onRowClicked={openDetail}
          pointerOnHover
          highlightOnHover
          rightContent={
            <ButtonGroup>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileSpreadsheet}
                onClick={exportExcel}
                title="Export Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Export Excel"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileText}
                onClick={exportPDF}
                title="Export PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Export PDF"
              />
            </ButtonGroup>
          }
          noDataComponent={
            loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader size="md" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No spare server rows yet. Run the Perseo hourly sync or check the API connection.
              </div>
            )
          }
        />
      </Card>

      <Modal open={detailOpen} onClose={closeDetail} title="Spare part" size="md">
        {selectedRow && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Image</p>
              <SparePartThumbnail productosid={selectedRow.productosid} variant="modal" />
            </div>
            <div>
              <DetailRow label="Code">{selectedRow.productocodigo || '—'}</DetailRow>
              <DetailRow label="Product ID">{selectedRow.productosid}</DetailRow>
              <DetailRow label="Description">{selectedRow.description || '—'}</DetailRow>
              <DetailRow label="Tariff prices">
                {(() => {
                  const list = spareAllTariffPrices(selectedRow);
                  if (list.length === 0) return '—';
                  return (
                    <div className="flex flex-row flex-wrap gap-x-3 gap-y-1 tabular-nums">
                      {list.map((e, i) => (
                        <span key={`${e.tarifasid ?? 'x'}-${i}`}>
                          {e.tarifasid != null ? `Tariff ${e.tarifasid}` : 'Tariff'}: {formatPrice(e.base)}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </DetailRow>
              <DetailRow label="Stock">{selectedRow.stock != null ? String(selectedRow.stock) : '—'}</DetailRow>
              <DetailRow label="Synced">{formatDate(selectedRow.updatedAt)}</DetailRow>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
