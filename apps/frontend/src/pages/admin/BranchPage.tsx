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
import * as branchesApi from '../../api/branches';
import type { Branch } from './branch/types';
import { getBranchColumns, branchColumns, BranchFormModal } from './branch';

const exportOptions = { title: 'Branch', filename: 'branch' };

export function BranchPage() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<Branch[]>([]);

  const fetchBranches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { branches: list } = await branchesApi.getBranches(token);
      setBranches(list);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: Branch[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(branchColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(branchColumns, filteredDataRef.current, exportOptions);

  const openNewModal = useCallback(() => {
    setEditingBranch(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((branch: Branch) => {
    setEditingBranch(branch);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((branch: Branch) => {
    setDeleteError(null);
    setDeleteConfirm(branch);
  }, []);

  const handleDeleteConfirm = useCallback(
    async () => {
      if (!token || !deleteConfirm) return;
      setDeleteLoading(true);
      setDeleteError(null);
      try {
        await branchesApi.deleteBranch(token, deleteConfirm.id);
        setDeleteConfirm(null);
        await fetchBranches();
      } catch (err) {
        setDeleteError((err as Error).message);
      } finally {
        setDeleteLoading(false);
      }
    },
    [token, deleteConfirm, fetchBranches]
  );

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: {
    branchName: string;
    email: string;
    phone: string;
    address: string;
    state: 'active' | 'inactive';
  }) => {
    if (!token) return;
    if (editingBranch) {
      await branchesApi.updateBranch(token, editingBranch.id, {
        branchName: data.branchName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        state: data.state,
      });
    } else {
      await branchesApi.createBranch(token, {
        branchName: data.branchName,
        email: data.email,
        phone: data.phone,
        address: data.address,
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
    () => getBranchColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Branch - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'System', icon: Home }, { label: 'Branch' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          New Branch
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Branch>
          data={branches}
          columns={columns}
          searchFields={['branchName', 'email', 'phone', 'address']}
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

      <BranchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        branch={editingBranch}
        onSuccess={fetchBranches}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete branch"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.branchName}"? This action cannot be undone.`
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
