import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Accessible Tooltip component
 * Uses React Portal to mount directly into document.body so it is never
 * clipped by overflow-hidden, overflow-y-auto, or scroll boundaries in the sidebar.
 */
export const Tooltip = ({
  content,
  children,
  position = 'right',
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (position === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
      });
    } else if (position === 'left') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.left - 10,
      });
    } else if (position === 'top') {
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    } else {
      setCoords({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleOpen = () => {
    calculatePosition();
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Keep position accurate if window is scrolled or resized while open
  useEffect(() => {
    if (!isVisible) return;
    const handleScrollOrResize = () => {
      calculatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, position]);

  if (!content || disabled) {
    return <>{children}</>;
  }

  const transformStyle =
    position === 'right'
      ? 'translateY(-50%)'
      : position === 'left'
      ? 'translate(-100%, -50%)'
      : position === 'top'
      ? 'translate(-50%, -100%)'
      : 'translateX(-50%)';

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex items-center justify-center"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        {children}
      </div>

      {isVisible &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: transformStyle,
              zIndex: 9999,
            }}
            className={`
              pointer-events-none
              whitespace-nowrap
              px-2.5
              py-1.5
              text-xs
              font-semibold
              text-[var(--text-primary)]
              bg-[var(--surface-elevated)]
              border
              border-[var(--border)]
              rounded-lg
              shadow-2xl
              animate-fade-in
              ${className}
            `}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;

