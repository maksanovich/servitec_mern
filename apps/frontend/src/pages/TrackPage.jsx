import { useState } from 'react';

// Track order by track number - no auth required
export function TrackPage() {
  const [trackNumber, setTrackNumber] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      // TODO: Call API when track endpoint is ready
      // const res = await fetch(`/api/track/${trackNumber}`);
      setStatus({ message: 'Endpoint pendiente', trackNumber: trackNumber.trim() });
    } catch (err) {
      setStatus({ error: 'Error al buscar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header>
        <a href="/">Servitec</a>
        <nav>
          <a href="/">Inicio</a>
          <a href="/blog">Blog</a>
          <a href="/track">Rastrear orden</a>
        </nav>
      </header>
      <section>
        <h1>Rastrear tu orden</h1>
        <p>Ingresa tu número de seguimiento para ver el estado.</p>
        <form onSubmit={handleTrack}>
          <input
            type="text"
            value={trackNumber}
            onChange={(e) => setTrackNumber(e.target.value)}
            placeholder="Número de seguimiento"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Rastrear'}
          </button>
        </form>
        {status && (
          <div>
            {status.error ? (
              <p>{status.error}</p>
            ) : (
              <p>Track: {status.trackNumber} - {status.message}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
