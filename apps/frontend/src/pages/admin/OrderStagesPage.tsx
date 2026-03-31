import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, Plus, ArrowUp, ArrowDown, Trash2, Pencil } from 'lucide-react';
import { PageHeader, Card, Button, ConfirmDialog, Modal, Input, Select, Loader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import {
  createOrderProgressStage,
  deleteOrderProgressStage,
  getOrderProgressStagesAdmin,
  updateOrderProgressStage,
  type OrderProgressStage,
} from '../../api/orderProgressStages';
import type { OrderArea } from '../../api/orders';

type StageForm = {
  key: string;
  label: string;
  description: string;
  legacyArea: OrderArea;
};

const LEGACY_AREA_OPTIONS: Array<{ value: OrderArea; label: string }> = [
  { value: 'entrance', label: 'Entrance' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'waiting-parts', label: 'Waiting for spare parts' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'delivery', label: 'Delivery' },
];

function legacyAreaLabel(area: OrderArea): string {
  return LEGACY_AREA_OPTIONS.find((o) => o.value === area)?.label ?? area;
}

export function OrderStagesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<OrderProgressStage[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<StageForm>({
    key: '',
    label: '',
    description: '',
    legacyArea: 'maintenance',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<OrderProgressStage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingStage, setEditingStage] = useState<OrderProgressStage | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const filteredDataRef = useRef<OrderProgressStage[]>([]);

  const fetchStages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { stages: list } = await getOrderProgressStagesAdmin(token);
      setStages(list);
    } catch (e) {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  useEffect(() => {
    filteredDataRef.current = stages;
  }, [stages]);

  const openNewStageModal = useCallback(() => {
    setFormError(null);
    setFormSaving(false);
    setForm({
      key: '',
      label: '',
      description: '',
      legacyArea: 'maintenance',
    });
    setFormOpen(true);
  }, []);

  const closeNewStageModal = useCallback(() => {
    if (formSaving) return;
    setFormOpen(false);
    setFormError(null);
  }, [formSaving]);

  const handleAddStage = useCallback(async () => {
    if (!token) return;
    setFormError(null);
    setFormSaving(true);
    try {
      const payload = {
        key: form.key,
        label: form.label,
        description: form.description,
        legacyArea: form.legacyArea,
      };
      const { stage } = await createOrderProgressStage(token, payload);
      setFormOpen(false);
      setFormSaving(false);
      setFormError(null);
      await fetchStages();
      return stage;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to add stage');
    } finally {
      setFormSaving(false);
    }
  }, [token, form, fetchStages]);

  const handleDeleteClick = useCallback((stage: OrderProgressStage) => {
    setDeleteError(null);
    setDeleteConfirm(stage);
  }, []);

  const openEditStage = useCallback((stage: OrderProgressStage) => {
    setEditError(null);
    setEditSaving(false);
    setEditLabel(stage.label);
    setEditingStage(stage);
  }, []);

  const closeEditStage = useCallback(() => {
    if (editSaving) return;
    setEditingStage(null);
    setEditError(null);
  }, [editSaving]);

  const handleSaveStageName = useCallback(async () => {
    if (!token || !editingStage) return;
    const trimmed = editLabel.trim();
    if (!trimmed) {
      setEditError('Label is required');
      return;
    }
    if (trimmed === editingStage.label) {
      setEditingStage(null);
      setEditError(null);
      return;
    }
    setEditError(null);
    setEditSaving(true);
    try {
      await updateOrderProgressStage(token, editingStage.id, { label: trimmed });
      setEditingStage(null);
      await fetchStages();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update stage name');
    } finally {
      setEditSaving(false);
    }
  }, [token, editingStage, editLabel, fetchStages]);

  const handleDeleteCancel = useCallback(() => {
    if (deleteLoading) return;
    setDeleteConfirm(null);
    setDeleteError(null);
  }, [deleteLoading]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteOrderProgressStage(token, deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchStages();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete stage');
    } finally {
      setDeleteLoading(false);
    }
  }, [token, deleteConfirm, fetchStages]);

  const isReorderInProgressRef = useRef(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const swapSortOrder = useCallback(
    async (indexA: number, indexB: number) => {
      if (!token) return;
      if (indexA < 0 || indexB < 0 || indexA >= stages.length || indexB >= stages.length) return;
      if (isReorderInProgressRef.current) return;

      isReorderInProgressRef.current = true;
      setReorderError(null);
      try {
        const a = stages[indexA];
        const b = stages[indexB];
        await updateOrderProgressStage(token, a.id, { sortOrder: b.sortOrder });
        await updateOrderProgressStage(token, b.id, { sortOrder: a.sortOrder });
        await fetchStages();
      } catch (e) {
        setReorderError(e instanceof Error ? e.message : 'Failed to reorder stages');
      } finally {
        isReorderInProgressRef.current = false;
      }
    },
    [token, stages, fetchStages]
  );

  const exportPDF = () => {
    // Not implemented for stages manager yet.
    void filteredDataRef.current;
  };

  const exportExcel = () => {
    // Not implemented for stages manager yet.
    void filteredDataRef.current;
  };

  const tableRows = useMemo(() => stages.slice().sort((a, b) => a.sortOrder - b.sortOrder), [stages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Order Stages - DIGITALSERVER TECHNICAL SERVICE" breadcrumb={[{ label: 'Operations', icon: Home }, { label: 'Order Stages' }]} />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={openNewStageModal} leftIcon={Plus}>
            Add stage
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reorderError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {reorderError}
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                  <th className="text-left py-3 px-4 font-semibold">Order</th>
                  <th className="text-left py-3 px-4 font-semibold">Label</th>
                  <th className="text-left py-3 px-4 font-semibold">Key</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="w-[220px] py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No stages configured.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((s, index) => (
                    <tr key={s.id} className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{index + 1}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-100">{s.label}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 dark:text-slate-200">{s.key}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{legacyAreaLabel(s.legacyArea)}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {s.description?.trim() ? s.description : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={ArrowUp}
                            onClick={() => swapSortOrder(index, index - 1)}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={ArrowDown}
                            onClick={() => swapSortOrder(index, index + 1)}
                            disabled={index === tableRows.length - 1}
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={Pencil}
                            onClick={() => openEditStage(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={Trash2}
                            onClick={() => handleDeleteClick(s)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={formOpen} onClose={closeNewStageModal} title="Add order stage" size="lg">
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Label *</label>
            <Input value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="e.g. Diagnosis" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Key *</label>
            <Input value={form.key} onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))} placeholder="e.g. diagnosis" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Workflow area *</label>
            <Select
              value={form.legacyArea}
              options={LEGACY_AREA_OPTIONS}
              onChange={(e) => setForm((prev) => ({ ...prev, legacyArea: e.target.value as OrderArea }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="red" size="md" onClick={closeNewStageModal} disabled={formSaving}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleAddStage} isLoading={formSaving}>
            Add
          </Button>
        </div>
      </Modal>

      <Modal open={!!editingStage} onClose={closeEditStage} title="Edit stage name" size="md">
        {editError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {editError}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Stage name *</label>
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="e.g. Diagnosis"
            autoFocus
          />
          {editingStage && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Key <span className="font-mono">{editingStage.key}</span> is unchanged; only the display name updates.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="red" size="md" onClick={closeEditStage} disabled={editSaving}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleSaveStageName} isLoading={editSaving}>
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete order stage"
        message={
          deleteConfirm
            ? `Delete "${deleteConfirm.label}"? Orders will be moved to the previous stage automatically.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteLoading}
        error={deleteError}
      />

      <div className="hidden">
        <button onClick={exportPDF} />
        <button onClick={exportExcel} />
      </div>
    </div>
  );
}

