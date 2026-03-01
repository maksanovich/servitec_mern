import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, Download, Plus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
  exportTableToCSV,
} from '../../components/datatable';
import { sampleAccessories, accessoriesColumns } from './accessories';
import type { Accessory } from './accessories';

const exportOptions = { title: 'Accessories', filename: 'accessories' };

export function AccessoriesPage() {
  const filteredDataRef = useRef<Accessory[]>([]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Accessory[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(accessoriesColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(accessoriesColumns, filteredDataRef.current, exportOptions);
  const exportCSV = () => exportTableToCSV(accessoriesColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Accessories - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Workshop', icon: Home }, { label: 'Accessories' }]}
        />
        <Link to="/admin/accessories/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={Plus}>
            New Accessory
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Accessory>
          data={sampleAccessories}
          columns={accessoriesColumns}
          searchFields={['branch', 'artifact']}
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
                leftIcon={Download}
                onClick={exportCSV}
                title="Export CSV"
                className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                aria-label="Export CSV"
              />
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  );
}
