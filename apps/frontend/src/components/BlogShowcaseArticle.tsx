import type { OrderShowcaseItem } from '../api/orders';
import noImageUrl from '../assets/images/noimage.png';

export function BlogShowcaseArticle({ order }: { order: OrderShowcaseItem }) {
  return (
    <article className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {order.brand} {order.model} — {order.series}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-4">
          <time dateTime={order.createdAt}>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '—'}
          </time>
          <span>{order.type}</span>
          <span className="font-mono text-slate-600">#{order.code}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Before</p>
          <img
            src={order.photoBeforeRepair?.trim() ? order.photoBeforeRepair : noImageUrl}
            alt="Before repair"
            className="w-full aspect-square object-contain rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">After</p>
          <img
            src={order.photoAfterRepair?.trim() ? order.photoAfterRepair : noImageUrl}
            alt="After repair"
            className="w-full aspect-square object-contain rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>
      </div>

      {(order.equipmentCondition || order.technicalReport) && (
        <div className="px-6 pb-6 pt-0 space-y-4">
          {order.equipmentCondition && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Condition</p>
              <p className="text-slate-700 leading-relaxed">{order.equipmentCondition}</p>
            </div>
          )}
          {order.technicalReport && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Technical notes</p>
              <p className="text-slate-700 leading-relaxed">{order.technicalReport}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
