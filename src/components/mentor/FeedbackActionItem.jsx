import React from 'react';
import { Check, Trash2, Clock } from 'lucide-react';
import { Badge } from '../common/Badge';

export const FeedbackActionItem = ({
  item,
  onToggle,
  onRemove,
  readOnly = false,
  className = '',
}) => {
  const priorityVariants = {
    High: 'danger',
    Medium: 'warning',
    Low: 'cyan',
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
        item.completed
          ? 'bg-[var(--surface-secondary)]/40 border-[var(--border)]/60 text-[var(--text-muted)]'
          : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-indigo-500/40 text-[var(--text-primary)]'
      } ${className}`}
    >
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onToggle && onToggle(item.id)}
        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
          readOnly ? 'cursor-default' : 'cursor-pointer'
        } ${
          item.completed
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:border-indigo-500 text-transparent hover:text-indigo-400'
        }`}
        aria-label={item.completed ? 'Mark as incomplete' : 'Mark as completed'}
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            item.completed ? 'line-through text-[var(--text-muted)]' : 'font-medium text-[var(--text-primary)]'
          }`}
        >
          {item.text}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.priority && (
          <Badge
            variant={priorityVariants[item.priority] || 'default'}
            size="sm"
            className="text-[10px] font-mono uppercase"
          >
            {item.priority}
          </Badge>
        )}

        {onRemove && !readOnly && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
            aria-label="Remove action item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
