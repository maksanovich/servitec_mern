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
import * as usersApi from '../../api/users';
import type { User } from './user/types';
import { getUserColumns, userColumns, UserFormModal } from './user';

const exportOptions = { title: 'Users', filename: 'users' };

export function UserPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filteredDataRef = useRef<User[]>([]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { users: list } = await usersApi.getUsers(token);
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: User[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(userColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(userColumns, filteredDataRef.current, exportOptions);

  const openNewModal = useCallback(() => {
    setEditingUser(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((user: User) => {
    setDeleteError(null);
    setDeleteConfirm(user);
  }, []);

  const handleDeleteConfirm = useCallback(
    async () => {
      if (!token || !deleteConfirm) return;
      setDeleteLoading(true);
      setDeleteError(null);
      try {
        await usersApi.deleteUser(token, deleteConfirm.id);
        setDeleteConfirm(null);
        await fetchUsers();
      } catch (err) {
        setDeleteError((err as Error).message);
      } finally {
        setDeleteLoading(false);
      }
    },
    [token, deleteConfirm, fetchUsers]
  );

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleFormSubmit = async (data: {
    email: string;
    password?: string;
    name: string;
    identification: string;
    phone: string;
    roleId: string;
    state: 'active' | 'inactive';
    avatar?: string;
  }) => {
    if (!token) return;
    if (editingUser) {
      await usersApi.updateUser(token, editingUser.id, {
        name: data.name,
        identification: data.identification,
        phone: data.phone,
        roleId: data.roleId,
        password: data.password,
        state: data.state,
        avatar: data.avatar,
      });
    } else {
      await usersApi.createUser(token, {
        email: data.email,
        password: data.password!,
        name: data.name,
        identification: data.identification,
        phone: data.phone,
        roleId: data.roleId,
        state: data.state,
        avatar: data.avatar,
      });
    }
  };

  const isDeleteDisabled = useCallback((user: User) => {
    return user.role?.slug === 'super_admin';
  }, []);

  const columnActions = useMemo(
    () => ({
      onEdit: openEditModal,
      onDelete: handleDeleteClick,
      isDeleteDisabled,
    }),
    [openEditModal, handleDeleteClick, isDeleteDisabled]
  );

  const columns = useMemo(
    () => getUserColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Usuarios — Servicio técnico DIGITALSERVER"
          breadcrumb={[{ label: 'Sistema', icon: Home }, { label: 'Usuarios' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={Plus}
          onClick={openNewModal}
          className="sm:ml-auto"
        >
          Nuevo usuario
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<User>
          data={users}
          columns={columns}
          searchFields={['id', 'name', 'identification', 'email', 'phone']}
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
                No data available in this table.
              </div>
            )
          }
        />
      </Card>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSuccess={fetchUsers}
        onSubmit={handleFormSubmit}
        token={token}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar usuario"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.name || deleteConfirm.email}"? This action cannot be undone.`
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
