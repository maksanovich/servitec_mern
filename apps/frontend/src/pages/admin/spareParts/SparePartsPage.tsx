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

const exportOptions = { title: 'Repuestos (Perseo)', filename: 'catalogo-repuestos' };

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
        title="Repuestos — Servicio técnico DIGITALSERVER"
        breadcrumb={[{ label: 'Catálogo y finanzas', icon: Home }, { label: 'Repuestos' }]}
      />

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Catálogo sincronizado desde Perseo (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">SpareServer</code>
        ). Se actualiza con la sincronización horaria.
      </p>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<SpareServerRow>
          data={items}
          columns={sparePartsColumns}
          searchFields={['productocodigo', 'description', 'productosid']}
          searchPlaceholder="Buscar:"
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
                title="Exportar Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Exportar Excel"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileText}
                onClick={exportPDF}
                title="Exportar PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Exportar PDF"
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
                Aún no hay datos. Ejecute la sincronización horaria de Perseo o compruebe la conexión con la API.
              </div>
            )
          }
        />
      </Card>

      <Modal open={detailOpen} onClose={closeDetail} title="Repuesto" size="md">
        {selectedRow && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Imagen</p>
              <SparePartThumbnail productosid={selectedRow.productosid} variant="modal" />
            </div>
            <div>
              <DetailRow label="Código">{selectedRow.productocodigo || '—'}</DetailRow>
              <DetailRow label="ID producto">{selectedRow.productosid}</DetailRow>
              <DetailRow label="Descripción">{selectedRow.description || '—'}</DetailRow>
              <DetailRow label="Precios por tarifa">
                {(() => {
                  const list = spareAllTariffPrices(selectedRow);
                  if (list.length === 0) return '—';
                  return (
                    <div className="flex flex-row flex-wrap gap-x-3 gap-y-1 tabular-nums">
                      {list.map((e, i) => (
                        <span key={`${e.tarifasid ?? 'x'}-${i}`}>
                          {e.tarifasid != null ? `Tarifa ${e.tarifasid}` : 'Tarifa'}: {formatPrice(e.base)}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </DetailRow>
              <DetailRow label="Stock">{selectedRow.stock != null ? String(selectedRow.stock) : '—'}</DetailRow>
              <DetailRow label="Sincronizado">{formatDate(selectedRow.updatedAt)}</DetailRow>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
