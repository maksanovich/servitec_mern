import type { ServiceSparePartItem } from './types';

interface Props {
  data: ServiceSparePartItem;
}

export function ExpandableServiceRow({ data }: Props) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">ID</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.id}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Branch</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.branch}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Type</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{data.type}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">State</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{data.state}</p>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Details</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.details}</p>
        </div>
      </div>
    </div>
  );
}
