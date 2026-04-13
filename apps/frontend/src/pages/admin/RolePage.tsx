import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Plus } from 'lucide-react';
import { PageHeader, Card, Button, Loader, ConfirmDialog } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
} from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import * as rolesApi from '../../api/roles';
import type { Role } from '../../api/roles';
import { getRoleColumns, RoleFormModal } from './role/index';

export function RolePage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<Role[]>([]);

  const fetchRoles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { roles: list } = await rolesApi.getRoles(token);
      setRoles(list);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: Role[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const openNewModal = useCallback(() => {
    setEditingRole(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((role: Role) => {
    setEditingRole(role);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((role: Role) => {
    setDeleteError(null);
    setDeleteConfirm(role);
  }, []);

  const handleDeleteConfirm = useCallback(
    async () => {
      if (!token || !deleteConfirm) return;
      setDeleteLoading(true);
      setDeleteError(null);
      try {
        await rolesApi.deleteRole(token, deleteConfirm.id);
        setDeleteConfirm(null);
        await fetchRoles();
      } catch (err) {
        setDeleteError((err as Error).message);
      } finally {
        setDeleteLoading(false);
      }
    },
    [token, deleteConfirm, fetchRoles]
  );

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: {
    name: string;
    slug: string;
    description: string;
    state: 'active' | 'inactive';
    pages: string[];
  }) => {
    if (!token) return;
    if (editingRole) {
      await rolesApi.updateRole(token, editingRole.id, data);
    } else {
      await rolesApi.createRole(token, data);
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
    () => getRoleColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Roles — Servicio técnico DIGITALSERVER"
          breadcrumb={[{ label: 'Sistema', icon: Home }, { label: 'Roles' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          New Role
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Role>
          data={roles}
          columns={columns}
          searchFields={['name', 'slug', 'description']}
          searchPlaceholder="Buscar:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
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

      <RoleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role={editingRole}
        onSuccess={fetchRoles}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar rol"
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
