import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, Plus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, ConfirmDialog } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../../api/products';
import { getProductsColumns } from './products';
import type { Product } from './products';
import { ProductFormModal } from './products/ProductFormModal';

const exportOptions = { title: 'Products', filename: 'products' };

export function ProductsPage() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredDataRef = useRef<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isNewRoute = location.pathname.endsWith('/products/new');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { products: list } = await getProducts(token);
      setProducts(list);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!isNewRoute) return;
    setEditingProduct(null);
    setFormOpen(true);
  }, [isNewRoute]);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditingProduct(null);
    if (isNewRoute) navigate('/admin/products', { replace: true });
  }, [isNewRoute, navigate]);

  const handleOpenNewForm = useCallback(() => {
    setEditingProduct(null);
    setFormOpen(true);
  }, []);

  const handleOpenEditForm = useCallback((p: Product) => {
    setEditingProduct(p);
    setFormOpen(true);
  }, []);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Product[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setDeleteError(null);
    setDeleteConfirm(product);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteProduct(token, deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchProducts();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  }, [token, deleteConfirm, fetchProducts]);

  const columns = useMemo(
    () =>
      getProductsColumns({
        onEdit: handleOpenEditForm,
        onDelete: handleDeleteClick,
      }),
    [handleDeleteClick, handleOpenEditForm]
  );

  const exportPDF = () => exportTableToPDF(columns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(columns, filteredDataRef.current, exportOptions);

  const handleFormSubmit = useCallback(
    async (data: { product: string; state: 'active' | 'inactive' }) => {
      if (!token) return;
      if (editingProduct) {
        await updateProduct(token, editingProduct.id, data);
      } else {
        await createProduct(token, data);
      }
    },
    [token, editingProduct]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Products - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Workshop', icon: Home }, { label: 'Products' }]}
        />
        <Button variant="emerald" size="md" leftIcon={Plus} onClick={handleOpenNewForm} className="sm:ml-auto">
          New Product
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Product>
          data={products}
          columns={columns}
          searchFields={['product']}
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
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No products found.
              </div>
            )
          }
        />
      </Card>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete product"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.product}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteLoading}
        error={deleteError}
      />

      <ProductFormModal
        open={formOpen}
        onClose={handleCloseForm}
        product={editingProduct}
        onSuccess={fetchProducts}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
