import { useRef, useCallback, useState } from 'react';
import { Home, FileText, FileSpreadsheet } from 'lucide-react';
import { PageHeader, Card, ButtonGroup, Button } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import * as companyApi from '../../api/company';
import type { Company } from './company/types';
import { getCompanyColumns, companyColumns, CompanyFormModal } from './company';

const exportOptions = { title: 'Company', filename: 'company' };

export function CompanyPage() {
  const { token } = useAuth();
  const { company, refetchCompany } = useCompany();
  const filteredDataRef = useRef<Company[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const tableData = company ? [company] : [];


  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: Company[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(companyColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(companyColumns, filteredDataRef.current, exportOptions);

  const openEditModal = useCallback((c: Company) => {
    setEditingCompany(c);
    setModalOpen(true);
  }, []);

  const columns = useRef(getCompanyColumns({ onEdit: openEditModal })).current;

  const handleCompanySubmit = async (data: {
    companyName: string;
    ruc: string;
    web: string;
    phone: string;
    email: string;
    address: string;
    googleMaps: string;
    companyInformation: string;
    logo?: string;
  }) => {
    if (!token) return;
    await companyApi.updateCompany(token, data);
    await refetchCompany();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Empresa — Servicio técnico DIGITALSERVER"
        breadcrumb={[{ label: 'Sistema', icon: Home }, { label: 'Empresa' }]}
      />

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Company>
          data={tableData}
          columns={columns}
          searchFields={['ruc', 'companyName', 'email', 'phone', 'address']}
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
        />
      </Card>

      <CompanyFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCompany(null);
        }}
        company={editingCompany}
        token={token}
        onSuccess={() => {}}
        onSubmit={handleCompanySubmit}
      />
    </div>
  );
}
