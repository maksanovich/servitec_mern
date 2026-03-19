import type { Order } from './types';
import { stateLabel } from './constants';

export function OrderExpandedRow({ data }: { data: Order }) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Code</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.code}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">State</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{stateLabel[data.state]}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Equipment</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.equipment}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Series</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.series}</p>
        </div>
        <div className="sm:col-span-2">
          <span className="text-slate-500 dark:text-slate-400">Customer</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {data.customer} ({data.customerId})
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Technical</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.technical}</p>
        </div>
        <div className="sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Equipment Condition</span>
          <p className="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
            {data.equipmentCondition?.trim() ? data.equipmentCondition : '-'}
          </p>
        </div>
        <div className="sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Technical Report</span>
          <p className="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
            {data.technicalReport?.trim() ? data.technicalReport : '-'}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">${data.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
