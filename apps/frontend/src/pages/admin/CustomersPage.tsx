import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, UserPlus } from 'lucide-react';
import { PageHeader, Card, Button } from '../../components/ui';
import { DataTableWithToolbar, type DataTableFilterState } from '../../components/datatable';
import { sampleCustomers, customersColumns } from './customers';
import type { Customer } from './customers';

export function CustomersPage() {
  const filteredDataRef = useRef<Customer[]>([]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Customer[]) => {
    filteredDataRef.current = filteredData;
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
        <DataTableWithToolbar<Customer>
          data={sampleCustomers}
          columns={customersColumns}
          searchFields={['id', 'names', 'surnames', 'email', 'phone']}
          searchPlaceholder="Look for:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
        />
      </Card>
    </div>
  );
}
