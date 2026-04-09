import { useState, FormEvent, useEffect } from 'react';
import {
  trackOrderByCode,
  downloadTechnicalReportDocx,
  isOrderEligibleForTechnicalReport,
  type OrderArea,
  type OrderTrackPublic,
  type OrderWorkflow,
} from '../api/orders';
import { stateLabel } from './admin/orders/constants';
import noImageUrl from '../assets/images/noimage.png';
import type { OrderProgressStage } from '../api/orderProgressStages';
import { getOrderProgressStagesPublic } from '../api/orderProgressStages';
import { RichTextHtml } from '../components/ui';
import { htmlToPlainText } from '../utils/htmlPlainText';
import { hasOrderPhotos, normalizeOrderPhotoListFromApi } from '../utils/orderPhotos';
import { OrderPhotoSlider } from '../components/OrderPhotoSlider';

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

type TimelineStage = Pick<OrderProgressStage, 'key' | 'label' | 'description' | 'sortOrder' | 'legacyArea'>;

/** Stages only used for long non-pickup; they should not appear on the public repair timeline. */
const QUARANTINE_ABANDONMENT_AREAS: OrderArea[] = ['quarantine', 'abandonment'];

const QUARANTINE_ABANDONMENT_STAGE_KEYS = new Set([
  'delivery-quarantine',
  'delivery-abandonment',
  'warranty-quarantine',
  'warranty-abandonment',
]);

function shouldHideLiveRepairProgress(order: OrderTrackPublic): boolean {
  if (QUARANTINE_ABANDONMENT_AREAS.includes(order.area)) return true;
  const k = order.progressStageKey;
  return k != null && QUARANTINE_ABANDONMENT_STAGE_KEYS.has(k);
}

function repairTimelineStages(stages: TimelineStage[]): TimelineStage[] {
  return stages.filter(
    (s) => s.legacyArea == null || !QUARANTINE_ABANDONMENT_AREAS.includes(s.legacyArea)
  );
}

const FALLBACK_STAGES: TimelineStage[] = [
  {
    key: 'inbound-receiving',
    label: 'Inbound/Receiving',
    description: 'Your equipment was received and registered by our team.',
    sortOrder: 0,
    legacyArea: 'entrance',
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    description: 'Technicians are checking the issue and defining the repair plan.',
    sortOrder: 1,
    legacyArea: 'maintenance',
  },
  {
    key: 'approval',
    label: 'Approval',
    description: 'Confirming approval for the suggested repair/parts.',
    sortOrder: 2,
    legacyArea: 'maintenance',
  },
  {
    key: 'waiting-parts',
    label: 'Waiting for spare parts',
    description: 'We are waiting for the required spare parts to arrive.',
    sortOrder: 3,
    legacyArea: 'waiting-parts',
  },
  {
    key: 'repair',
    label: 'Repair',
    description: 'Repair in progress and parts replacement.',
    sortOrder: 4,
    legacyArea: 'maintenance',
  },
  {
    key: 'testing',
    label: 'Testing',
    description: 'Final testing and quality check before warehouse prep.',
    sortOrder: 5,
    legacyArea: 'maintenance',
  },
  {
    key: 'warehouse-ready',
    label: 'Warehouse/Ready for delivery',
    description: 'The equipment is ready in the warehouse for delivery.',
    sortOrder: 6,
    legacyArea: 'warehouse',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Your equipment is ready for pickup or already delivered.',
    sortOrder: 7,
    legacyArea: 'delivery',
  },
];

function getCurrentStageIndex(
  stageKey: string | undefined,
  timelineStages: TimelineStage[],
  order: Pick<OrderTrackPublic, 'state'>
): number {
  if (timelineStages.length === 0) return 0;
  /** Picked up / closed — repair flow is complete for display purposes. */
  if (order.state === 'finished') return timelineStages.length - 1;
  if (!stageKey) return 0;
  const idx = timelineStages.findIndex((s) => s.key === stageKey);
  return idx === -1 ? 0 : idx;
}

function getTimelineProgress(currentIndex: number, stagesLength: number): number {
  if (stagesLength <= 0) return 0;
  const clamped = Math.max(0, Math.min(currentIndex, stagesLength - 1));
  return Math.round(((clamped + 1) / stagesLength) * 100);
}

export function TrackPage() {
  const [trackNumber, setTrackNumber] = useState('');
  const [order, setOrder] = useState<OrderTrackPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<TimelineStage[]>(FALLBACK_STAGES);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) {
      setStages(FALLBACK_STAGES);
      return;
    }
    let mounted = true;
    const wf: OrderWorkflow = order.workflow === 'warranty' ? 'warranty' : 'standard';
    (async () => {
      try {
        setStagesLoading(true);
        const { stages: list } = await getOrderProgressStagesPublic(wf);
        if (!mounted) return;
        setStages(
          (list ?? [])
            .map(
              (s) =>
                ({
                  key: s.key,
                  label: s.label,
                  description: s.description,
                  sortOrder: s.sortOrder,
                  legacyArea: s.legacyArea,
                }) as TimelineStage
            )
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
      } catch (e) {
        if (!mounted) return;
        setStages(FALLBACK_STAGES);
      } finally {
        if (mounted) setStagesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [order?.workflow, order?.code]);

  const timelineStages = order ? repairTimelineStages(stages) : [];
  const currentStageIndex = order
    ? getCurrentStageIndex(order.progressStageKey, timelineStages, order)
    : 0;
  const timelineProgress = getTimelineProgress(currentStageIndex, timelineStages.length);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    const code = trackNumber.trim();
    if (!code) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setReportError(null);
    try {
      const { order: o } = await trackOrderByCode(code);
      setOrder(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[640px]">
      <h1 className="text-[1.75rem] font-bold tracking-tight mb-2 text-slate-900">
        Track Your Order
      </h1>
      <p className="text-base text-slate-500 mb-6">
        Enter your tracking code (same code we gave you when the equipment was received) to see status and photos.
      </p>
      <form onSubmit={handleTrack} className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={trackNumber}
          onChange={(e) => setTrackNumber(e.target.value)}
          placeholder="Tracking code"
          disabled={loading}
          autoComplete="off"
          className="flex-1 min-w-[200px] px-4 py-3 border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[var(--color-accent)] text-white border-none rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && (
        <p className="mt-6 text-red-600" role="alert">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 space-y-6 border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
          {!shouldHideLiveRepairProgress(order) && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-4" aria-busy={stagesLoading}>
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-sm font-semibold text-indigo-900">Live repair progress</p>
                <p className="text-sm font-semibold text-indigo-800">{timelineProgress}%</p>
              </div>
              <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${timelineProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {timelineStages.map((step, index) => {
                  const isDone = index <= currentStageIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isDone ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        aria-hidden="true"
                      />
                      <span className={`text-xs font-medium ${isDone ? 'text-indigo-900' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-indigo-900">{timelineStages[currentStageIndex]?.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tracking code</p>
            <p className="text-lg font-mono font-semibold text-slate-900">{order.code}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
              <p className="font-medium text-slate-900">
                {stages.find((s) => s.key === order.progressStageKey)?.label ?? stateLabel[order.state]}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipment</p>
              <p className="font-medium text-slate-900">
                {order.brand} / {order.model} — {order.series}
              </p>
            </div>
            {order.createdAt && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</p>
                <p className="font-medium text-slate-900">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            {order.warranty !== undefined && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Warranty</p>
                <p className="font-medium text-slate-900">{order.warranty ? 'Included' : 'No warranty'}</p>
              </div>
            )}
          </div>

          {(order.budgetLines && order.budgetLines.length > 0) || order.salesContact ? (
            <div className="border-t border-slate-200 pt-6 space-y-5">
              {order.budgetLines && order.budgetLines.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-3">Products & services used</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Items recorded for this technical service and their prices.
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-2 font-semibold text-slate-700">Product / service</th>
                          <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Unit price</th>
                          <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Qty</th>
                          <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.budgetLines.map((line, i) => (
                          <tr key={`${line.serviceId}-${i}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-900">{line.name}</td>
                            <td className="px-3 py-2 text-slate-800 text-right tabular-nums">{formatUsd(line.price)}</td>
                            <td className="px-3 py-2 text-slate-800 text-right tabular-nums">{line.amount}</td>
                            <td className="px-3 py-2 text-slate-900 text-right font-medium tabular-nums">
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

              {order.salesContact &&
                (order.salesContact.phone?.trim() ||
                  order.salesContact.email?.trim() ||
                  order.salesContact.companyName?.trim()) && (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Sales contact</p>
                    <p className="text-xs text-slate-500 mb-3">
                      For questions about this bill or spare parts, reach our sales team.
                    </p>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-2">
                      {order.salesContact.companyName?.trim() && (
                        <p className="font-semibold text-slate-900">{order.salesContact.companyName.trim()}</p>
                      )}
                      {order.salesContact.phone?.trim() && (
                        <p className="text-slate-800">
                          <span className="text-slate-500 mr-2">Phone</span>
                          <a
                            href={`tel:${order.salesContact.phone.replace(/\s/g, '')}`}
                            className="font-medium text-indigo-700 hover:underline"
                          >
                            {order.salesContact.phone.trim()}
                          </a>
                        </p>
                      )}
                      {order.salesContact.email?.trim() && (
                        <p className="text-slate-800">
                          <span className="text-slate-500 mr-2">Email</span>
                          <a
                            href={`mailto:${order.salesContact.email.trim()}`}
                            className="font-medium text-indigo-700 hover:underline break-all"
                          >
                            {order.salesContact.email.trim()}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : null}

          {isOrderEligibleForTechnicalReport(order) && (
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-800 mb-2">Technical report</p>
              <button
                type="button"
                disabled={reportLoading}
                onClick={async () => {
                  setReportError(null);
                  setReportLoading(true);
                  try {
                    await downloadTechnicalReportDocx(order.code);
                  } catch (err) {
                    setReportError(err instanceof Error ? err.message : 'Download failed');
                  } finally {
                    setReportLoading(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {reportLoading ? 'Preparing…' : 'Download technical report (.docx)'}
              </button>
              {reportError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {reportError}
                </p>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-800 mb-3">Repair Trust Card</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Parts quality</p>
                <p className="font-medium text-slate-900">Verified by Servitec</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Quality checklist</p>
                <p className="font-medium text-slate-900">
                  {order.state === 'finished' || order.state === 'delivery' ? 'Final test passed' : 'In progress'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Photo evidence</p>
                <p className="font-medium text-slate-900">
                  {hasOrderPhotos(order.photoAfterRepair) ? 'Before & after available' : 'Before photo available'}
                </p>
              </div>
            </div>
          </div>

          {order.whatsappLink?.trim() && (
            <div className="border-t border-slate-200 pt-6">
              <a
                href={order.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                Request status update on WhatsApp
              </a>
            </div>
          )}

          {(htmlToPlainText(order.equipmentCondition ?? '') || htmlToPlainText(order.technicalReport ?? '')) && (
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-800 mb-3">Technical Notes</p>
              <div className="space-y-4 text-sm text-slate-900">
                {htmlToPlainText(order.equipmentCondition ?? '') && (
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Condition</p>
                    <RichTextHtml html={order.equipmentCondition ?? ''} className="text-slate-900" />
                  </div>
                )}
                {htmlToPlainText(order.technicalReport ?? '') && (
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Report</p>
                    <RichTextHtml html={order.technicalReport ?? ''} className="text-slate-900" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-800 mb-3">Photos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-2">Before repair</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoBeforeRepair)}
                  emptySrc={noImageUrl}
                  alt="Equipment before repair"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">After repair</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoAfterRepair)}
                  emptySrc={noImageUrl}
                  alt="Equipment after repair"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
