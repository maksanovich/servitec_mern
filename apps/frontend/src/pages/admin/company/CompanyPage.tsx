import { useRef, useCallback } from 'react';
import { Home, FileText, FileSpreadsheet, LayoutGrid } from 'lucide-react';
import { PageHeader, Card, ButtonGroup, Button } from '../../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
  exportTableToCSV,
} from '../../../components/datatable';
import { sampleCompany, companyColumns, type Company } from './index';

const exportOptions = { title: 'Company', filename: 'company' };

export function CompanyPage() {
  const filteredDataRef = useRef<Company[]>([]);

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
  const exportCSV = () =>
    exportTableToCSV(companyColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Company - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[{ label: 'Dashboard', icon: Home }, { label: 'Company' }]}
      />

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Company>
          data={sampleCompany}
          columns={companyColumns}
          searchFields={['ruc', 'companyName', 'email', 'phone', 'address']}
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
              <Button
                variant="secondary"
                size="sm"
                leftIcon={LayoutGrid}
                title="Columns"
                className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                aria-label="Columns"
              />
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  );
}
