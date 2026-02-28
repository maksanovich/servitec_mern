import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Box, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
  exportTableToCSV,
} from '../../components/datatable';
import { sampleModels, modelsColumns } from './models';
import type { Model } from './models';

const exportOptions = { title: 'Models', filename: 'models' };

export function ModelsPage() {
  const filteredDataRef = useRef<Model[]>([]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Model[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(modelsColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(modelsColumns, filteredDataRef.current, exportOptions);
  const exportCSV = () => exportTableToCSV(modelsColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Models - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Dashboard', icon: Home }, { label: 'Model' }]}
        />
        <Link to="/admin/model/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={Box}>
            New Model
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Model>
          data={sampleModels}
          columns={modelsColumns}
          searchFields={['brand', 'model']}
          searchPlaceholder="Look for:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          rightContent={
            <ButtonGroup>
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
                leftIcon={FileSpreadsheet}
                onClick={exportExcel}
                title="Export Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Export Excel"
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
