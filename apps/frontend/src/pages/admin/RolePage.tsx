import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, FileText, FileSpreadsheet, LayoutGrid } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { sampleRole, roleColumns, type Role } from './role/index';

const exportOptions = { title: 'Role', filename: 'role' };

export function RolePage() {
  const filteredDataRef = useRef<Role[]>([]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: Role[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(roleColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(roleColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Roles - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'System', icon: Home }, { label: 'Role' }]}
        />
        <Link to="/admin/roles/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={Plus}>
            New Role
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Role>
          data={sampleRole}
          columns={roleColumns}
          searchFields={['role', 'description']}
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
