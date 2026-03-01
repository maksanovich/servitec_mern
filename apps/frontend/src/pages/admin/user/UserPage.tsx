import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, LayoutGrid, Plus } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
  exportTableToCSV,
} from '../../../components/datatable';
import { sampleUser, userColumns, type User } from './index';

const exportOptions = { title: 'Users', filename: 'users' };

export function UserPage() {
  const filteredDataRef = useRef<User[]>([]);

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
  const exportCSV = () =>
    exportTableToCSV(userColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Users - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Dashboard', icon: Home }, { label: 'User' }]}
        />
        <Link to="/admin/users/new" className="sm:ml-auto">
          <Button variant="emerald" size="md" leftIcon={Plus}>
            New User
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<User>
          data={sampleUser}
          columns={userColumns}
          searchFields={['id', 'names', 'surnames', 'email', 'phone', 'role']}
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
