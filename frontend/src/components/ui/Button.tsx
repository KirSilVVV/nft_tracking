import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS BUTTON COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Variants: primary, ghost, outline
 * Sizes: sm, md (default), lg
 *
 * Examples:
 * <Button variant="primary">Launch App</Button>
 * <Button variant="ghost" size="lg">Learn More</Button>
 * <Button onClick={handleClick}>Click me</Button>
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style */
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Full width button */
  fullWidth?: boolean;

  /** Optional icon (left side) */
  icon?: React.ReactNode;

  /** Optional icon (right side) */
  iconRight?: React.ReactNode;

  /** Loading state */
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconRight,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes (always applied)
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-semibold transition-all duration-medium',
    'cursor-pointer outline-none border-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' ');

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-gold text-bg',
      'hover:bg-gold-hover hover:-translate-y-0.5',
      'hover:shadow-btn-primary',
    ].join(' '),

    ghost: [
      'bg-transparent text-text-2',
      'border border-border2',
      'hover:border-text-2 hover:text-text-1',
    ].join(' '),

    outline: [
      'bg-transparent text-gold',
      'border border-gold',
      'hover:bg-gold-light hover:border-gold-hover',
    ].join(' '),

    danger: [
      'bg-error text-bg',
      'hover:bg-[#ff5252] hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(255,107,107,0.3)]',
    ].join(' '),
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  // Full width
  const widthClass = fullWidth ? 'w-full' : '';

  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ].join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
