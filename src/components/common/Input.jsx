import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  required = false,
  disabled = false,
  fullWidth = true,
  className = '',
  showStrengthMeter = false,
  strengthScore = 0, // 0 to 4
  strengthLabel = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const strengthColors = ['bg-slate-700', 'bg-rose-500', 'bg-amber-500', 'bg-sky-400', 'bg-emerald-400'];

  return (
    <div className={`space-y-1.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-semibold text-[var(--text-primary)]">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        </div>
      )}

      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full
            px-3.5
            py-2.5
            rounded-xl
            bg-[var(--input-bg)]
            border
            text-sm
            text-[var(--input-text)]
            placeholder-[var(--input-placeholder)]
            transition-all
            duration-150
            focus:outline-hidden
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-10' : ''}
            ${isPassword || RightIcon ? 'pr-10' : ''}
            ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-[var(--input-border)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:border-[var(--border-strong)]'
            }
          `}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : RightIcon ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <RightIcon className="w-4 h-4" />
          </div>
        ) : null}
      </div>

      {showStrengthMeter && (
        <div className="space-y-1 pt-1">
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${
                  strengthScore >= step ? strengthColors[strengthScore] : 'bg-[var(--surface-tertiary)]'
                }`}
              />
            ))}
          </div>
          {strengthLabel && (
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Password Security:</span>
              <span className="font-semibold text-[var(--text-primary)]">{strengthLabel}</span>
            </div>
          )}
        </div>
      )}

      {error ? (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
