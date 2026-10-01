import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible Modal dialog component
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-xl',
  showClose = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent scrolling behind modal
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`
          w-full
          ${maxWidth}
          bg-[var(--modal-bg)]
          border
          border-[var(--modal-border)]
          rounded-2xl
          shadow-2xl
          overflow-hidden
          text-[var(--text-primary)]
          my-8
          relative
          transition-colors duration-200
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div>
              {title && (
                <h3 id="modal-title" className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
