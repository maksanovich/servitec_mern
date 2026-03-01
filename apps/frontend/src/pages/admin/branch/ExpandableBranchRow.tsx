import type { Branch } from './types';

interface Props {
  data: Branch;
}

export function ExpandableBranchRow({ data }: Props) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">ID</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.id}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Branch Name</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.branchName}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Email</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.email}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">State</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{data.state}</p>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Address</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">{data.address}</p>
        </div>
      </div>
    </div>
  );
}
