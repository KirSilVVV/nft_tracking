import React, { forwardRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS INPUT COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Features: validation, error states, icons, labels
 *
 * Examples:
 * <Input placeholder="Enter address..." />
 * <Input label="Wallet Address" error="Invalid address" />
 * <Input icon={<SearchIcon />} />
 */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;

  /** Error message */
  error?: string;

  /** Helper text */
  helperText?: string;

  /** Success state */
  success?: boolean;

  /** Icon (left side) */
  icon?: React.ReactNode;

  /** Icon (right side) */
  iconRight?: React.ReactNode;

  /** Input size */
  inputSize?: 'sm' | 'md' | 'lg';

  /** Full width */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  success = false,
  icon,
  iconRight,
  inputSize = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  // Input wrapper classes
  const wrapperClasses = [
    'relative flex items-center',
    'bg-card border rounded-md transition-all duration-fast',
    hasError ? 'border-error focus-within:border-error' : '',
    hasSuccess ? 'border-success focus-within:border-success' : '',
    !hasError && !hasSuccess ? 'border-border focus-within:border-gold' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  // Input classes
  const inputClasses = [
    'flex-1 bg-transparent outline-none',
    'text-text-1 placeholder:text-text-3',
    'disabled:cursor-not-allowed',
    sizeClasses[inputSize],
    icon ? 'pl-2' : '',
    iconRight ? 'pr-2' : '',
    className,
  ].join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-text-2 mb-2">
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className={wrapperClasses}>
        {/* Left icon */}
        {icon && (
          <span className="flex-shrink-0 ml-3 text-text-3">
            {icon}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />

        {/* Right icon */}
        {iconRight && (
          <span className="flex-shrink-0 mr-3 text-text-3">
            {iconRight}
          </span>
        )}

        {/* Success indicator */}
        {hasSuccess && !iconRight && (
          <span className="flex-shrink-0 mr-3 text-success">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        )}

        {/* Error indicator */}
        {hasError && !iconRight && (
          <span className="flex-shrink-0 mr-3 text-error">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-text-3">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
