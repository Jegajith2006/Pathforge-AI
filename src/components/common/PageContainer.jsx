import React from 'react';

export const PageContainer = ({
  children,
  maxWidth = '7xl', // '5xl', '6xl', '7xl', 'full'
  className = '',
  withGlow = false,
  ...props
}) => {
  const maxStyles = {
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] overflow-hidden">
      {withGlow && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-30 dark:opacity-100 transition-opacity">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[300px] bg-violet-600/10 rounded-full blur-[120px]" />
        </div>
      )}

      <div
        className={`
          w-full
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
          ${maxStyles[maxWidth] || maxStyles['7xl']}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
