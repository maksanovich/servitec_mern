import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Rendered in the header to the left of the close button (e.g. primary actions). */
  headerActions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl max-h-[90vh] flex flex-col',
  '2xl': 'max-w-screen-2xl max-h-[95vh] flex flex-col',
};

export function Modal({ open, onClose, title, children, headerActions, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl ${size === 'xl' ? 'flex flex-col' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="modal-title" className="min-w-0 flex-1 text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1.5 -mr-1.5"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className={size === 'xl' ? 'flex-1 min-h-0 overflow-y-auto p-5' : 'p-5'}>
          {children}
        </div>
      </div>
    </div>
  );
}
