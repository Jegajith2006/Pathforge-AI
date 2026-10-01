import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
}) => {
  const buttonColors = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30',
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30',
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] rounded-xl transition-colors cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${buttonColors}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
