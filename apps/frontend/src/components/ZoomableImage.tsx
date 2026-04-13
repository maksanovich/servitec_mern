import { useState } from 'react';
import { Modal } from './ui/Modal';

type ZoomableImageProps = {
  src: string;
  alt: string;
  /** Tailwind classes for the thumbnail (size, radius, border). */
  className?: string;
};

export function ZoomableImage({ src, alt, className = 'h-12 w-12 rounded-md' }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 cursor-zoom-in overflow-hidden border border-slate-200 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${className}`}
        aria-label={`Ampliar imagen: ${alt}`}
      >
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={alt} size="2xl">
        <div className="flex justify-center py-1">
          <img
            src={src}
            alt={alt}
            className="max-h-[min(85vh,1200px)] w-auto max-w-full object-contain rounded-lg"
          />
        </div>
      </Modal>
    </>
  );
}
