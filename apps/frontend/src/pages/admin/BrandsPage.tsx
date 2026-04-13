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
import * as brandsApi from '../../api/brands';
import { getBrandColumns, brandsColumns, BrandFormModal } from './brands';
import type { Brand } from './brands';

const exportOptions = { title: 'Brands', filename: 'brands' };

export function BrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Brand | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<Brand[]>([]);

  const fetchBrands = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { brands: list } = await brandsApi.getBrands(token);
      setBrands(list);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: Brand[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(brandsColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(brandsColumns, filteredDataRef.current, exportOptions);

  const openNewModal = useCallback(() => {
    setEditingBrand(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((brand: Brand) => {
    setEditingBrand(brand);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((brand: Brand) => {
    setDeleteError(null);
    setDeleteConfirm(brand);
  }, []);

  const handleDeleteConfirm = useCallback(
    async () => {
      if (!token || !deleteConfirm) return;
      setDeleteLoading(true);
      setDeleteError(null);
      try {
        await brandsApi.deleteBrand(token, deleteConfirm.id);
        setDeleteConfirm(null);
        await fetchBrands();
      } catch (err) {
        setDeleteError((err as Error).message);
      } finally {
        setDeleteLoading(false);
      }
    },
    [token, deleteConfirm, fetchBrands]
  );

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: { name: string; state: 'active' | 'inactive' }) => {
    if (!token) return;
    if (editingBrand) {
      await brandsApi.updateBrand(token, editingBrand.id, {
        name: data.name,
        state: data.state,
      });
    } else {
      await brandsApi.createBrand(token, {
        name: data.name,
        state: data.state,
      });
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
    () => getBrandColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Marcas — Servicio técnico DIGITALSERVER"
          breadcrumb={[{ label: 'Taller', icon: Home }, { label: 'Marcas' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          New Brand
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Brand>
          data={brands}
          columns={columns}
          searchFields={['name']}
          searchPlaceholder="Buscar:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          rightContent={
            <ButtonGroup>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileText}
                onClick={exportPDF}
                title="Exportar PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Exportar PDF"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileSpreadsheet}
                onClick={exportExcel}
                title="Exportar Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Exportar Excel"
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

      <BrandFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        brand={editingBrand}
        onSuccess={fetchBrands}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar marca"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
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
