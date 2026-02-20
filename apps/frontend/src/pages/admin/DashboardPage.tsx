import {
  Home,
  DollarSign,
  Wrench,
  Calendar,
  BarChart3,
  FileText,
  List,
  CalendarDays,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';

interface KpiCard {
  label: string;
  value: string;
  sublabel: string | null;
  icon: LucideIcon;
}

interface AgendaAction {
  label: string;
  icon: LucideIcon;
  color: string;
}

const kpiCards: KpiCard[] = [
  { label: 'Income', value: '$0.00', sublabel: 'Daily', icon: DollarSign },
  { label: 'Orders', value: '3131', sublabel: 'Total', icon: Wrench },
  { label: 'Maintenance Orders', value: '1225', sublabel: null, icon: Wrench },
  { label: 'Orders Delivered', value: '219', sublabel: null, icon: Wrench },
];

const agendaActions: AgendaAction[] = [
  { label: 'Chart', icon: BarChart3, color: 'bg-emerald-600' },
  { label: 'Document', icon: FileText, color: 'bg-red-600' },
  { label: 'List', icon: List, color: 'bg-amber-600' },
  { label: 'Calendar', icon: CalendarDays, color: 'bg-orange-500' },
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
      {/* Page title and breadcrumb */}
      <div>
        <h1 className="text-xl font-semibold text-white">
          Dashboard - DIGITALSERVER TECHNICAL SERVICE
        </h1>
        <nav className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </nav>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, sublabel, icon: Icon }) => (
          <div
            key={label}
            className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">{label}</div>
              <div className="text-white font-semibold">
                {value}
                {sublabel && <span className="text-slate-500 font-normal text-sm ml-1">{sublabel}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agenda Items */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex flex-wrap items-center gap-4">
          <h2 className="text-base font-semibold text-white">Agenda Items</h2>
          <div className="flex gap-2 ml-auto">
            {agendaActions.map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-white text-sm font-medium ${color} hover:opacity-90 transition-opacity`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <select className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option>Show 10 records</option>
          </select>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm">2026-02-20, 2026-02-20</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Look for:"
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Branch</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Customer</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Area</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">State</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Service</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Advancement</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Total</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Debt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No data available in this table.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-slate-500 text-sm">
          <span>Showing records 0 to 0 out of a total of 0 records</span>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 rounded hover:bg-slate-700 text-slate-400">
              Previous
            </button>
            <button type="button" className="px-3 py-1 rounded hover:bg-slate-700 text-slate-400">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bottom two tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="p-4 text-base font-semibold text-white border-b border-slate-700">
            Client with Largest Investment
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Investment</th>
                </tr>
              </thead>
              <tbody>
                {largestInvestmentData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-300">{row.date}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.customer} ({row.id})
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 text-xs font-medium">
                        ${row.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="p-4 text-base font-semibold text-white border-b border-slate-700">
            Client with the Most Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {mostOrdersData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-300">{row.date}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.customer} ({row.id})
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 text-xs font-medium">
                        {row.orders}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
