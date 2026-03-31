import { useState, FormEvent, useEffect } from 'react';
import {
  trackOrderByCode,
  downloadTechnicalReportDocx,
  isOrderEligibleForTechnicalReport,
  type OrderTrackPublic,
} from '../api/orders';
import { stateLabel } from './admin/orders/constants';
import noImageUrl from '../assets/images/noimage.png';
import type { OrderProgressStage } from '../api/orderProgressStages';
import { getOrderProgressStagesPublic } from '../api/orderProgressStages';

type TimelineStage = Pick<OrderProgressStage, 'key' | 'label' | 'description' | 'sortOrder'>;

const FALLBACK_STAGES: TimelineStage[] = [
  {
    key: 'inbound-receiving',
    label: 'Inbound/Receiving',
    description: 'Your equipment was received and registered by our team.',
    sortOrder: 0,
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    description: 'Technicians are checking the issue and defining the repair plan.',
    sortOrder: 1,
  },
  {
    key: 'approval',
    label: 'Approval',
    description: 'Confirming approval for the suggested repair/parts.',
    sortOrder: 2,
  },
  {
    key: 'waiting-parts',
    label: 'Waiting for spare parts',
    description: 'We are waiting for the required spare parts to arrive.',
    sortOrder: 3,
  },
  {
    key: 'repair',
    label: 'Repair',
    description: 'Repair in progress and parts replacement.',
    sortOrder: 4,
  },
  {
    key: 'testing',
    label: 'Testing',
    description: 'Final testing and quality check before warehouse prep.',
    sortOrder: 5,
  },
  {
    key: 'warehouse-ready',
    label: 'Warehouse/Ready for delivery',
    description: 'The equipment is ready in the warehouse for delivery.',
    sortOrder: 6,
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Your equipment is ready for pickup or already delivered.',
    sortOrder: 7,
  },
];

function getCurrentStageIndex(stageKey: string | undefined, stages: TimelineStage[]): number {
  if (!stageKey) return 0;
  const idx = stages.findIndex((s) => s.key === stageKey);
  return idx === -1 ? 0 : idx;
}

function getTimelineProgress(currentIndex: number, stagesLength: number): number {
  if (stagesLength <= 1) return 0;
  return Math.round((currentIndex / (stagesLength - 1)) * 100);
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
    let mounted = true;
    (async () => {
      try {
        setStagesLoading(true);
        const { stages: list } = await getOrderProgressStagesPublic();
        if (!mounted) return;
        setStages(
          (list ?? [])
            .map((s) => ({ key: s.key, label: s.label, description: s.description, sortOrder: s.sortOrder } as TimelineStage))
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
  }, []);

  const currentStageIndex = getCurrentStageIndex(order?.progressStageKey, stages);
  const timelineProgress = getTimelineProgress(currentStageIndex, stages.length);

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
              {stages.map((step, index) => {
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
              <p className="mt-3 text-xs text-indigo-900">{stages[currentStageIndex]?.description}</p>
          </div>

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
                  {order.photoAfterRepair?.trim() ? 'Before & after available' : 'Before photo available'}
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

          {(order.equipmentCondition || order.technicalReport) && (
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-800 mb-3">Technical Notes</p>
              <div className="space-y-2 text-sm text-slate-600">
                {order.equipmentCondition && (
                  <p>
                    <span className="font-medium text-slate-700">Condition: </span>
                    {order.equipmentCondition}
                  </p>
                )}
                {order.technicalReport && (
                  <p>
                    <span className="font-medium text-slate-700">Report: </span>
                    {order.technicalReport}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-800 mb-3">Photos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-2">Before repair</p>
                <img
                  src={order.photoBeforeRepair?.trim() ? order.photoBeforeRepair : noImageUrl}
                  alt="Equipment before repair"
                  className="w-full max-h-64 rounded-lg object-contain border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">After repair</p>
                <img
                  src={order.photoAfterRepair?.trim() ? order.photoAfterRepair : noImageUrl}
                  alt="Equipment after repair"
                  className="w-full max-h-64 rounded-lg object-contain border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
