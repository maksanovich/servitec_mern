import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Home, FileText, FileSpreadsheet, Plus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, Loader, ConfirmDialog } from '../../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../../components/datatable';
import { useAuth } from '../../../contexts/AuthContext';
import * as servicesApi from '../../../api/servicesSpareParts';
import { getServicesColumns } from './servicesColumns';
import { ServiceSparePartFormModal } from './ServiceSparePartFormModal';
import type { ServiceSparePartItem } from '../../../api/servicesSpareParts';

const exportOptions = { title: 'Servicios', filename: 'servicios' };

/** Set to true to show "New Service" and row Edit/Delete actions again. */
const ENABLE_SERVICE_ADMIN_ACTIONS = false;

export function ServicesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ServiceSparePartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceSparePartItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceSparePartItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<ServiceSparePartItem[]>([]);

  const serviceRows = useMemo(() => items.filter((i) => i.type === 'service'), [items]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: ServiceSparePartItem[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { items: list } = await servicesApi.getServicesSpareParts(token);
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

  const exportColumns = useMemo(
    () =>
      getServicesColumns(
        { onEdit: () => {}, onDelete: () => {} },
        {
          includeType: false,
          includeActions: false,
          includeAmount: false,
          nameColumnLabel: 'Código',
          nameColumnMinWidth: '140px',
          detailsColumnMinWidth: '360px',
        }
      ),
    []
  );

  const exportPDF = () => exportTableToPDF(exportColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(exportColumns, filteredDataRef.current, exportOptions);

  const openNewModal = useCallback(() => {
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: ServiceSparePartItem) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((item: ServiceSparePartItem) => {
    setDeleteError(null);
    setDeleteConfirm(item);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await servicesApi.deleteServiceSparePart(token, deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchItems();
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }, [token, deleteConfirm, fetchItems]);

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: Omit<ServiceSparePartItem, 'id'>) => {
    if (!token) return;
    if (editingItem) {
      await servicesApi.updateServiceSparePart(token, editingItem.id, data);
    } else {
      await servicesApi.createServiceSparePart(token, data);
    }
  };

  const columnActions = useMemo(
    () => ({
      onEdit: openEditModal,
      onDelete: handleDeleteClick,
    }),
    [openEditModal, handleDeleteClick]
  );

  const columns = useMemo(
    () =>
      getServicesColumns(ENABLE_SERVICE_ADMIN_ACTIONS ? columnActions : { onEdit: () => {}, onDelete: () => {} }, {
        includeType: false,
        includeActions: ENABLE_SERVICE_ADMIN_ACTIONS,
        includeAmount: false,
        nameColumnLabel: 'Código',
        nameColumnMinWidth: '140px',
        detailsColumnMinWidth: '360px',
      }),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Servicios — Servicio técnico DIGITALSERVER"
          breadcrumb={[{ label: 'Catálogo y finanzas', icon: Home }, { label: 'Servicios' }]}
        />
        {ENABLE_SERVICE_ADMIN_ACTIONS && (
          <Button
            variant="emerald"
            size="md"
            leftIcon={Plus}
            onClick={openNewModal}
            className="sm:ml-auto"
          >
            Nuevo servicio
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<ServiceSparePartItem>
          data={serviceRows}
          columns={columns}
          searchFields={['name', 'details']}
          searchPlaceholder="Buscar:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
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
                No hay datos en esta tabla.
              </div>
            )
          }
        />
      </Card>

      <ServiceSparePartFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editingItem}
        onSuccess={fetchItems}
        onSubmit={handleFormSubmit}
        servicesCatalogOnly
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar servicio"
        message={
          deleteConfirm
            ? `¿Seguro que desea eliminar "${deleteConfirm.name}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
