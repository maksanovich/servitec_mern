import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersShowcase } from '../api/orders';
import type { OrderShowcaseItem } from '../api/orders';
import noImageUrl from '../assets/images/noimage.png';
import { htmlToPlainText } from '../utils/htmlPlainText';
import { normalizeOrderPhotoListFromApi } from '../utils/orderPhotos';
import { OrderPhotoSlider } from '../components/OrderPhotoSlider';

function formatDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BlogPage() {
  const [orders, setOrders] = useState<OrderShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersShowcase(24)
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-bold tracking-tight mb-2 text-slate-900">
            Repair Stories
          </h1>
          <p className="text-base text-slate-500">
            Real examples of our repairs, with before/after photos and technical notes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="h-6 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="flex gap-2 mb-4">
                <div className="flex-1 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="aspect-square rounded-xl bg-slate-200 animate-pulse" />
                <div className="aspect-square rounded-xl bg-slate-200 animate-pulse" />
              </div>
              <div className="h-12 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="h-5 bg-slate-200 rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight mb-2 text-slate-900">
          Repair Stories
        </h1>
        <p className="text-base text-slate-500">
          Our completed repairs and technical solutions. Open any story for full before & after
          photos and technician notes.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-slate-500 py-8">No repair stories to show yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const condition = htmlToPlainText(order.equipmentCondition ?? '');
            const report = htmlToPlainText(order.technicalReport ?? '');
            const snippet = condition ? (report ? `${condition} ${report}` : condition) : report;

            return (
              <Link
                key={order.code}
                to={`/blog/${encodeURIComponent(order.code)}`}
                className="group block rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-shadow overflow-hidden text-left"
              >
                <div className="p-5 flex flex-col gap-4 h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                        {order.brand} {order.model} — {order.series}
                      </h2>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500 mt-1">
                        <span>{order.type}</span>
                        <span className="font-mono text-slate-600">#{order.code}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Published</p>
                      <time dateTime={order.createdAt} className="text-sm font-medium text-slate-600">
                        {formatDate(order.createdAt)}
                      </time>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Before
                      </p>
                      <OrderPhotoSlider
                        images={normalizeOrderPhotoListFromApi(order.photoBeforeRepair)}
                        emptySrc={noImageUrl}
                        alt=""
                        frameClassName="relative w-full aspect-square overflow-hidden rounded-lg bg-white border-0"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        After
                      </p>
                      <OrderPhotoSlider
                        images={normalizeOrderPhotoListFromApi(order.photoAfterRepair)}
                        emptySrc={noImageUrl}
                        alt=""
                        frameClassName="relative w-full aspect-square overflow-hidden rounded-lg bg-white border-0"
                      />
                    </div>
                  </div>

                  {snippet && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {snippet}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-sm font-medium text-[var(--color-accent)] group-hover:text-[var(--color-accent-hover)] transition-colors">
                      Read full story →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
