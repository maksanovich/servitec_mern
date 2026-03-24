import { useState, FormEvent } from 'react';
import { trackOrderByCode, type OrderTrackPublic } from '../api/orders';
import { AREA_TABS, stateLabel } from './admin/orders/constants';
import noImageUrl from '../assets/images/noimage.png';

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
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</p>
              <p className="font-medium text-slate-900">{order.branch}</p>
            </div>
            {order.createdAt && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</p>
                <p className="font-medium text-slate-900">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

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
