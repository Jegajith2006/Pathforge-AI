import React, { useState } from 'react';
import { Target, Edit3, Check, X, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const WeeklyGoalCard = ({
  initialGoal = 8.0,
  initialCompleted = 5.5,
}) => {
  const [goal, setGoal] = useState(initialGoal);
  const [completed, setCompleted] = useState(initialCompleted);
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(initialGoal.toString());
  const { addToast } = useToast();

  const remaining = Math.max(0, Number((goal - completed).toFixed(1)));
  const percent = Math.min(100, Math.round((completed / goal) * 100));

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const newGoalVal = parseFloat(editInput);
    if (isNaN(newGoalVal) || newGoalVal <= 0) {
      addToast('Please enter a valid weekly goal greater than 0 hours.', 'error');
      return;
    }
    setGoal(newGoalVal);
    setIsEditing(false);
    addToast(`Weekly learning goal updated to ${newGoalVal} hours.`, 'success');
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Weekly Learning Goal
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Structured sprint commitment to maintain trajectory.
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditInput(goal.toString());
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update Goal</span>
          </button>
        )}
      </div>

      {/* Edit Form or Display */}
      {isEditing ? (
        <form onSubmit={handleSaveGoal} className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            Set Weekly Study Target (hours):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="1"
              max="60"
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-center">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Target</div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                {goal} hrs
              </div>
            </div>
            <div className="border-x border-[var(--border)]">
              <div className="text-[11px] text-[var(--text-muted)]">Completed</div>
              <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {completed} hrs
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Remaining</div>
              <div className="text-sm font-bold font-mono text-[var(--text-secondary)]">
                {remaining} hrs
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Weekly Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">{percent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Motivational Footnote */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>
          {remaining === 0
            ? '🎉 Outstanding! You reached your sprint target ahead of time.'
            : `You need ${remaining} more hours before Sunday midnight to complete this sprint.`}
        </span>
      </div>
    </div>
  );
};

export default WeeklyGoalCard;
