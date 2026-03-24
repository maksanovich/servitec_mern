import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, UserPlus } from 'lucide-react';
import { PageHeader, Card, Button, Loader, ConfirmDialog } from '../../components/ui';
import { DataTable, DataTableToolbar, DataTablePagination } from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import { getClients, getClientById, updateClient, deleteClient } from '../../api/clients';
import type { Client } from '../../api/clients';
import { getClientsColumns } from './customers/customersColumns';
import { ClientEditModal } from './customers/ClientEditModal';
import { ClientCreateModal } from './customers/ClientCreateModal';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

export function CustomersPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const editFromUrl = searchParams.get('edit');
  const [clients, setClients] = useState<Awaited<ReturnType<typeof getClients>>['clients']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getClients(token, {
        page,
        limit: pageSize,
        search: search || undefined,
      });
      setClients(res.clients);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      setClients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (!editFromUrl || !token) return;
    const id = parseInt(editFromUrl, 10);
    if (!Number.isFinite(id)) return;

    let cancelled = false;
    (async () => {
      try {
        const client = await getClientById(token, id);
        if (cancelled) return;
        setEditClient(client);
        setEditModalOpen(true);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('edit');
            return next;
          },
          { replace: true }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load client';
        toast.error('Could not open client', { description: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editFromUrl, token, setSearchParams]);

  // Debounced search: apply search param when user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setEditClient(client);
    setEditModalOpen(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  const handleEditSubmit = useCallback(
    async (clientesid: number, payload: Parameters<typeof updateClient>[2]) => {
      if (!token) return;
      await updateClient(token, clientesid, payload);
    },
    [token]
  );

  const handleDeleteClick = useCallback((client: Client) => {
    setDeleteError(null);
    setDeleteConfirm(client);
  }, []);

  const handleDeleteConfirm = useCallback(
    async () => {
      if (!token || !deleteConfirm) return;
      setDeleteLoading(true);
      setDeleteError(null);
      try {
        await deleteClient(token, deleteConfirm.clientesid);
        setDeleteConfirm(null);
        toast.success('Client deleted successfully');
        await fetchClients();
      } catch (err) {
        const message = (err as Error).message;
        setDeleteError(message);
        toast.error('Delete failed', { description: message });
      } finally {
        setDeleteLoading(false);
      }
    },
    [token, deleteConfirm, fetchClients]
  );

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Clients - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Workshop', icon: Home }, { label: 'Clients' }]}
        />
        <Button
          variant="emerald"
          size="md"
          leftIcon={UserPlus}
          onClick={() => setCreateModalOpen(true)}
          className="sm:ml-auto"
        >
          New Customer
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableToolbar
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name, ID, email, phone..."
        />
        {error && (
          <div className="px-5 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}
        <div className="pb-5 w-full min-w-0 overflow-x-hidden overflow-hidden relative min-h-[280px]">
          <div
            aria-hidden={!loading}
            aria-live="polite"
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-[2px] transition-opacity duration-200"
            style={{
              opacity: loading ? 1 : 0,
              pointerEvents: loading ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <Loader size="lg" />
              <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Loading…</span>
            </div>
          </div>
          <DataTable
            className="w-full max-w-full"
            columns={getClientsColumns(handleEditClient, handleDeleteClick)}
            data={clients}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationDefaultPage={page}
            paginationPerPage={pageSize}
            paginationRowsPerPageOptions={PAGE_SIZE_OPTIONS}
            paginationComponent={DataTablePagination}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={(newPageSize) => {
              handlePageSizeChange(newPageSize);
            }}
            noDataComponent={
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                {loading ? 'Loading...' : 'No clients found. Clients are synced from Perseo hourly.'}
              </div>
            }
          />
        </div>
      </Card>
      <ClientEditModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditClient(null); }}
        client={editClient}
        onSuccess={handleEditSuccess}
        onSubmit={handleEditSubmit}
      />
      <ClientCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchClients}
        token={token}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete client"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.razonsocial || deleteConfirm.nombrecomercial || deleteConfirm.clientescodigo}"? This will remove the client from this system and from Perseo. This action cannot be undone.`
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
