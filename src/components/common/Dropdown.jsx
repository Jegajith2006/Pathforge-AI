import React, { useRef, useEffect } from 'react';

/**
 * Reusable Dropdown component with click-outside detection
 */
export const Dropdown = ({
  trigger,
  children,
  isOpen,
  onClose,
  align = 'right',
  width = 'w-56',
  className = '',
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {trigger}

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`
            absolute
            ${align === 'right' ? 'right-0' : 'left-0'}
            mt-2
            ${width}
            rounded-2xl
            bg-[var(--dropdown-bg)]
            border
            border-[var(--dropdown-border)]
            shadow-2xl
            z-50
            overflow-hidden
            animate-fade-in
            focus:outline-hidden
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
