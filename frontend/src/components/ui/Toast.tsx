import React, { useEffect, useState } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS TOAST COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Features: auto-dismiss, variants, animations
 *
 * Examples:
 * <Toast variant="success" message="Saved successfully!" />
 * <Toast variant="error" message="Something went wrong" duration={5000} />
 */

export interface ToastProps {
  /** Toast message */
  message: string;

  /** Toast variant */
  variant?: 'success' | 'error' | 'warning' | 'info';

  /** Auto-dismiss duration (ms) */
  duration?: number;

  /** Show close button */
  closable?: boolean;

  /** Close handler */
  onClose?: () => void;

  /** Optional icon */
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 4000,
  closable = true,
  onClose,
  icon,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // Variant styles
  const variantStyles = {
    success: {
      bg: 'bg-[var(--ok-d)]',
      border: 'border-success',
      text: 'text-success',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-[var(--no-d)]',
      border: 'border-error',
      text: 'text-error',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-[var(--warn-d)]',
      border: 'border-warning',
      text: 'text-warning',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-card-h',
      border: 'border-border2',
      text: 'text-text-1',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const style = variantStyles[variant];

  if (!visible) return null;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border
        ${style.bg} ${style.border}
        shadow-card animate-slideIn
        min-w-[300px] max-w-md
      `}
    >
      {/* Icon */}
      <span className={`flex-shrink-0 ${style.text}`}>
        {icon || style.icon}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-text-1 leading-snug">
        {message}
      </p>

      {/* Close button */}
      {closable && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-text-3 hover:text-text-1 transition-colors duration-fast"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Toast Container Component
 * Use this to manage multiple toasts
 */
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  children,
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed z-[2000] flex flex-col gap-3 ${positionClasses[position]}`}>
      {children}
    </div>
  );
};

export default Toast;
