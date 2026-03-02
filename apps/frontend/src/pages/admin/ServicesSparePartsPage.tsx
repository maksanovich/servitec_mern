import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, Plus, Minus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import {
  sampleServicesSpareParts,
  servicesColumns,
  ExpandableServiceRow,
} from './services';
import type { ServiceSparePartItem } from './services';

const exportOptions = { title: 'Services & Spare Parts', filename: 'services-spare-parts' };

export function ServicesSparePartsPage() {
  const filteredDataRef = useRef<ServiceSparePartItem[]>([]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: ServiceSparePartItem[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(servicesColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(servicesColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Services / Spare Parts - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Catalog & Finance', icon: Home }, { label: 'Services & Spare Parts' }]}
        />
        <Link to="/admin/services/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={Plus}>
            New Service / Spare Part
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<ServiceSparePartItem>
          data={sampleServicesSpareParts}
          columns={servicesColumns}
          searchFields={['branch', 'name', 'details']}
          searchPlaceholder="Look for:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          expandableRows
          expandableRowsComponent={ExpandableServiceRow}
          expandableIcon={{ collapsed: <Plus className="size-4" />, expanded: <Minus className="size-4" /> }}
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
        />
      </Card>
    </div>
  );
}
