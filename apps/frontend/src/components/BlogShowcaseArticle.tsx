import type { OrderTrackPublic } from '../api/orders';
import noImageUrl from '../assets/images/noimage.png';
import { RichTextHtml } from './ui';
import { htmlToPlainText } from '../utils/htmlPlainText';
import { normalizeOrderPhotoListFromApi } from '../utils/orderPhotos';
import { OrderPhotoSlider } from './OrderPhotoSlider';
import { stateLabel } from '../pages/admin/orders/constants';

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function normalizePhoneForWa(raw: string): string {
  return raw.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

function buildSalesWhatsAppLink(order: OrderTrackPublic): string {
  const phone = order.salesContact?.phone?.trim();
  if (!phone) return '';
  const normalized = normalizePhoneForWa(phone);
  if (!normalized) return '';
  const spareParts = (order.budgetLines ?? []).map((l) => l.name).filter(Boolean);
  const partsText = spareParts.length > 0 ? spareParts.join(', ') : 'the spare parts from this repair';
  const text = `Hi, I want to purchase ${partsText}. Tracking code: ${order.code}.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function BlogShowcaseArticle({ order }: { order: OrderTrackPublic }) {
  const salesWhatsAppLink = buildSalesWhatsAppLink(order);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
            <p className="font-medium text-slate-900">{stateLabel[order.state]}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Received</p>
            <p className="font-medium text-slate-900">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Warranty</p>
            <p className="font-medium text-slate-900">{order.warranty ? 'Included' : 'No warranty'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Before</p>
          <OrderPhotoSlider
            images={normalizeOrderPhotoListFromApi(order.photoBeforeRepair)}
            emptySrc={noImageUrl}
            alt="Before repair"
            imageClassName="w-full aspect-square object-contain rounded-lg border border-slate-200 bg-slate-50 max-h-none"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">After</p>
          <OrderPhotoSlider
            images={normalizeOrderPhotoListFromApi(order.photoAfterRepair)}
            emptySrc={noImageUrl}
            alt="After repair"
            imageClassName="w-full aspect-square object-contain rounded-lg border border-slate-200 bg-slate-50 max-h-none"
          />
        </div>
      </div>

      {(htmlToPlainText(order.equipmentCondition ?? '') || htmlToPlainText(order.technicalReport ?? '')) && (
        <div className="px-6 pb-6 pt-0 space-y-4">
          {htmlToPlainText(order.equipmentCondition ?? '') && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Condition</p>
              <RichTextHtml html={order.equipmentCondition ?? ''} className="text-slate-700 leading-relaxed" />
            </div>
          )}
          {htmlToPlainText(order.technicalReport ?? '') && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Technical notes</p>
              <RichTextHtml html={order.technicalReport ?? ''} className="text-slate-700 leading-relaxed" />
            </div>
          )}
        </div>
      )}

      {(order.budgetLines && order.budgetLines.length > 0) || order.salesContact ? (
        <div className="px-6 pb-6 pt-0 space-y-5">
          {order.budgetLines && order.budgetLines.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2">Spare parts used</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 font-semibold text-slate-700">Spare part / service</th>
                      <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Unit</th>
                      <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Qty</th>
                      <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.budgetLines.map((line, i) => (
                      <tr key={`${line.serviceId}-${i}`} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-medium text-slate-900">{line.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-800">{formatUsd(line.price)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-800">{line.amount}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900">
                          {formatUsd(line.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {order.total != null && Number.isFinite(order.total) && (
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-slate-700">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                          {formatUsd(order.total)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {(order.salesContact?.phone?.trim() || order.salesContact?.email?.trim()) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm space-y-3">
              <p className="text-sm font-semibold text-slate-800">Purchase or ask about spare parts</p>
              <div className="flex flex-wrap gap-2">
                {salesWhatsAppLink && (
                  <a
                    href={salesWhatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Buy via WhatsApp
                  </a>
                )}
                {order.salesContact?.phone?.trim() && (
                  <a
                    href={`tel:${order.salesContact.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-medium hover:bg-white transition-colors"
                  >
                    Call sales
                  </a>
                )}
                {order.salesContact?.email?.trim() && (
                  <a
                    href={`mailto:${order.salesContact.email.trim()}`}
                    className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-medium hover:bg-white transition-colors"
                  >
                    Email sales
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
