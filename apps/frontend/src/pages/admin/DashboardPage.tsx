import {
  Home,
  DollarSign,
  Wrench,
} from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from '../../components/ui';
import { AgendaItemsTable } from '../../components/AgendaItemsTable';

const kpiData = [
  { label: 'Income', value: '$0.00', sublabel: 'Daily' as const, icon: DollarSign },
  { label: 'Orders', value: '3131', sublabel: 'Total' as const, icon: Wrench },
  { label: 'Maintenance Orders', value: '1225', sublabel: null, icon: Wrench },
  { label: 'Orders Delivered', value: '219', sublabel: null, icon: Wrench },
];

const largestInvestmentData = [
  { date: '2021-03-01 09:56:52', customer: 'EDSON ESPINOZA MENDOZA', id: '43720082', amount: 370 },
  { date: '2023-09-09 16:26:15', customer: 'JOFFRE MURRIETA JOFFRE MURRIETA', id: '0921420311', amount: 300 },
];

const mostOrdersData = [
  { date: '2023-05-10 13:26:30', customer: 'XAVIER MEDINA XAVIER MEDINA', id: '0940973985', orders: 55 },
  { date: '2023-01-20 11:01:41', customer: 'KEN MARCELINO ORTIZ CASTRO', id: '0922957097', orders: 27 },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[{ label: 'Dashboard', icon: Home }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map(({ label, value, sublabel, icon }) => (
          <KpiCard key={label} label={label} value={value} sublabel={sublabel} icon={icon} />
        ))}
      </div>

      <AgendaItemsTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader title="Client with Largest Investment" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader columns={['Date', 'Customer', 'Investment']} />
              <TableBody>
                {largestInvestmentData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      {row.customer} ({row.id})
                    </TableCell>
                    <TableCell>
                      <Badge>${row.amount.toFixed(2)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Client with the Most Orders" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader columns={['Date', 'Customer', 'Orders']} />
              <TableBody>
                {mostOrdersData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      {row.customer} ({row.id})
                    </TableCell>
                    <TableCell>
                      <Badge>{row.orders}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
