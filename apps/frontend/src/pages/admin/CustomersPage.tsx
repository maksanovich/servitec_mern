import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, UserPlus } from 'lucide-react';
import { PageHeader, Card, Button } from '../../components/ui';
import { DataTable, DataTableToolbar, DataTablePagination } from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import { getClients } from '../../api/clients';
import { clientsColumns } from './customers';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

export function CustomersPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<Awaited<ReturnType<typeof getClients>>['clients']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Clients - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Workshop', icon: Home }, { label: 'Clients' }]}
        />
        <Link to="/admin/clients/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={UserPlus}>
            New Customer
          </Button>
        </Link>
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
        <div className="pb-5 w-full min-w-0 overflow-x-hidden overflow-hidden">
          <DataTable
            className="w-full max-w-full"
            columns={clientsColumns}
            data={clients}
            progressPending={loading}
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
    </div>
  );
}
