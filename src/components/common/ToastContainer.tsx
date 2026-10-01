import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
        let borderClass = 'border-emerald-500/30 bg-[var(--card-bg)]';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30 bg-[var(--card-bg)]';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/30 bg-[var(--card-bg)]';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-sky-500 dark:text-sky-400 shrink-0" />;
          borderClass = 'border-sky-500/30 bg-[var(--card-bg)]';
        }

        return (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
