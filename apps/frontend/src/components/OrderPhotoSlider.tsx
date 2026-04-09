import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_FRAME_CLASS =
  'relative w-full h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-50';

type OrderPhotoSliderProps = {
  images: string[];
  emptySrc: string;
  alt: string;
  className?: string;
  /** Outer wrapper around the image area; use a fixed height (or aspect ratio) so every slide matches. */
  frameClassName?: string;
  imageClassName?: string;
};

export function OrderPhotoSlider({
  images,
  emptySrc,
  alt,
  className = '',
  frameClassName = DEFAULT_FRAME_CLASS,
  imageClassName = '',
}: OrderPhotoSliderProps) {
  const urls = images.filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [urls.join('|')]);

  const n = urls.length;
  const safeIdx = n > 0 ? Math.min(idx, n - 1) : 0;
  const currentSrc = n > 0 ? urls[safeIdx] : emptySrc;

  const go = (dir: -1 | 1) => {
    if (n <= 1) return;
    setIdx((i) => (i + dir + n) % n);
  };

  return (
    <div
      className={`relative group ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div className={frameClassName}>
        <img
          src={currentSrc}
          alt={alt}
          className={['h-full w-full object-contain', imageClassName].filter(Boolean).join(' ')}
        />

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md border border-slate-200/80 hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md border border-slate-200/80 hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`pointer-events-auto h-2 w-2 rounded-full transition-colors ${
                    i === safeIdx ? 'bg-slate-800' : 'bg-white/80 border border-slate-300'
                  }`}
                  aria-label={`Photo ${i + 1} of ${n}`}
                  aria-current={i === safeIdx ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
