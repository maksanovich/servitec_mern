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
import * as modelsApi from '../../api/models';
import { getModelsColumns } from './models/modelsColumns';
import { ModelFormModal } from './models/ModelFormModal';
import type { Model } from './models';

const exportOptions = { title: 'Models', filename: 'models' };

export function ModelsPage() {
  const { token } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Model | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<Model[]>([]);

  const fetchModels = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { models: list } = await modelsApi.getModels(token);
      setModels(list);
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Model[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(columns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(columns, filteredDataRef.current, exportOptions);

  const openNewModal = useCallback(() => {
    setEditingModel(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((model: Model) => {
    setEditingModel(model);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((model: Model) => {
    setDeleteError(null);
    setDeleteConfirm(model);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await modelsApi.deleteModel(token, deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchModels();
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }, [token, deleteConfirm, fetchModels]);

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: { brand: string; model: string; state: 'active' | 'inactive' }) => {
    if (!token) return;
    if (editingModel) {
      await modelsApi.updateModel(token, editingModel.id, {
        brand: data.brand,
        model: data.model,
        state: data.state,
      });
    } else {
      await modelsApi.createModel(token, {
        brand: data.brand,
        model: data.model,
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
    () => getModelsColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Models - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Workshop', icon: Home }, { label: 'Models' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          New Model
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Model>
          data={models}
          columns={columns}
          searchFields={['brand', 'model']}
          searchPlaceholder="Look for:"
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
                title="Export PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Export PDF"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileSpreadsheet}
                onClick={exportExcel}
                title="Export Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Export Excel"
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

      <ModelFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        modelItem={editingModel}
        onSuccess={fetchModels}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete model"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.brand} - ${deleteConfirm.model}"? This action cannot be undone.`
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
