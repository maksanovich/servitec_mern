import { useState, FormEvent } from 'react';

interface TrackStatus {
  message?: string;
  trackNumber?: string;
  error?: string;
}

export function TrackPage() {
  const [trackNumber, setTrackNumber] = useState('');
  const [status, setStatus] = useState<TrackStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      // TODO: Call API when track endpoint is ready
      setStatus({ message: 'Endpoint pending', trackNumber: trackNumber.trim() });
    } catch (err) {
      setStatus({ error: 'Error searching' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px]">
      <h1 className="text-[1.75rem] font-bold tracking-tight mb-2 text-slate-900">
        Track Your Order
      </h1>
      <p className="text-base text-slate-500 mb-6">
        Enter your tracking number to see status and progress.
      </p>
      <form onSubmit={handleTrack} className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={trackNumber}
          onChange={(e) => setTrackNumber(e.target.value)}
          placeholder="Tracking number"
          disabled={loading}
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
      {status && (
        <div className="mt-6">
          {status.error ? (
            <p className="text-red-600">{status.error}</p>
          ) : (
            <p className="text-slate-500">
              Track: {status.trackNumber} — {status.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
