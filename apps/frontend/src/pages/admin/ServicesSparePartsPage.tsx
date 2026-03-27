import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Home, FileText, FileSpreadsheet, Plus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, Loader, ConfirmDialog } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import * as servicesApi from '../../api/servicesSpareParts';
import { getServicesColumns, servicesColumns, ServiceSparePartFormModal } from './services';
import type { ServiceSparePartItem } from '../../api/servicesSpareParts';

const exportOptions = { title: 'Services & Spare Parts', filename: 'services-spare-parts' };

export function ServicesSparePartsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ServiceSparePartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceSparePartItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceSparePartItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<ServiceSparePartItem[]>([]);

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

  const exportPDF = () => exportTableToPDF(servicesColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(servicesColumns, filteredDataRef.current, exportOptions);

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

  const columns = useMemo(() => getServicesColumns(columnActions), [columnActions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Services / Spare Parts - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Catalog & Finance', icon: Home }, { label: 'Services & Spare Parts' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          New Service / Spare Part
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<ServiceSparePartItem>
          data={items}
          columns={columns}
          searchFields={['name', 'details']}
          searchPlaceholder="Look for:"
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
                No data available in this table.
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
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete service / spare part"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
