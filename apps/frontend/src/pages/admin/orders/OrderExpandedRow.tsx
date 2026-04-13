import { RichTextHtml } from '../../../components/ui';
import { htmlToPlainText } from '../../../utils/htmlPlainText';
import type { Order } from './types';
import { stateLabel } from './constants';

export function OrderExpandedRow({ data }: { data: Order }) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Código</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.code}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Estado</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{stateLabel[data.state]}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Equipo</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.equipment}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Serie</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.series}</p>
        </div>
        <div className="sm:col-span-2">
          <span className="text-slate-500 dark:text-slate-400">Cliente</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {data.customer} ({data.customerId})
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Técnico</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.technical}</p>
        </div>
        <div className="sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Estado del equipo</span>
          {htmlToPlainText(data.equipmentCondition ?? '') ? (
            <RichTextHtml
              html={data.equipmentCondition}
              className="font-medium text-slate-900 dark:text-slate-100 mt-1"
            />
          ) : (
            <p className="font-medium text-slate-900 dark:text-slate-100">-</p>
          )}
        </div>
        <div className="sm:col-span-4">
          <span className="text-slate-500 dark:text-slate-400">Informe técnico</span>
          {htmlToPlainText(data.technicalReport ?? '') ? (
            <RichTextHtml
              html={data.technicalReport}
              className="font-medium text-slate-900 dark:text-slate-100 mt-1"
            />
          ) : (
            <p className="font-medium text-slate-900 dark:text-slate-100">-</p>
          )}
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">${data.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
