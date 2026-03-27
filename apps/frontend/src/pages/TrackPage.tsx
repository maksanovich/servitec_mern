import { useState, FormEvent } from 'react';
import { trackOrderByCode, type OrderTrackPublic } from '../api/orders';
import { AREA_TABS, stateLabel } from './admin/orders/constants';
import noImageUrl from '../assets/images/noimage.png';

type RepairStep = {
  id: string;
  label: string;
  states: OrderTrackPublic['state'][];
  description: string;
};

const REPAIR_TIMELINE: RepairStep[] = [
  {
    id: 'received',
    label: 'Received',
    states: ['income'],
    description: 'Your equipment was received and registered by our team.',
  },
  {
    id: 'diagnosis',
    label: 'Diagnosis',
    states: ['maintenance', 'waiting', 'no_solution'],
    description: 'Technicians are checking the issue and defining the repair plan.',
  },
  {
    id: 'repair',
    label: 'Repair / Parts',
    states: ['warehouse'],
    description: 'Repair completed and quality check in progress.',
  },
  {
    id: 'delivery',
    label: 'Ready for Delivery',
    states: ['delivery', 'finished'],
    description: 'Your equipment is ready for pickup or has already been delivered.',
  },
];

function getCurrentTimelineStep(state: OrderTrackPublic['state']): number {
  const idx = REPAIR_TIMELINE.findIndex((step) => step.states.includes(state));
  return idx === -1 ? 0 : idx;
}

function getTimelineProgress(state: OrderTrackPublic['state']): number {
  const step = getCurrentTimelineStep(state);
  if (REPAIR_TIMELINE.length <= 1) return 0;
  return Math.round((step / (REPAIR_TIMELINE.length - 1)) * 100);
}

export function TrackPage() {
  const [trackNumber, setTrackNumber] = useState('');
  const [order, setOrder] = useState<OrderTrackPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    const code = trackNumber.trim();
    if (!code) return;
    setLoading(true);
    setError(null);
    setOrder(null);
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
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-sm font-semibold text-indigo-900">Live repair progress</p>
              <p className="text-sm font-semibold text-indigo-800">{getTimelineProgress(order.state)}%</p>
            </div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${getTimelineProgress(order.state)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {REPAIR_TIMELINE.map((step, index) => {
                const current = getCurrentTimelineStep(order.state);
                const isDone = index <= current;
                return (
                  <div key={step.id} className="flex items-center gap-2">
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
            <p className="mt-3 text-xs text-indigo-900">
              {REPAIR_TIMELINE[getCurrentTimelineStep(order.state)]?.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tracking code</p>
            <p className="text-lg font-mono font-semibold text-slate-900">{order.code}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
              <p className="font-medium text-slate-900">{stateLabel[order.state]}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Area</p>
              <p className="font-medium text-slate-900">
                {AREA_TABS.find((a) => a.id === order.area)?.label ?? order.area}
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
