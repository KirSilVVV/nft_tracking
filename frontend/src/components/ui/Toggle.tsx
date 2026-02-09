import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS TOGGLE COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Features: switch toggle, sizes, disabled state
 *
 * Examples:
 * <Toggle checked={isOn} onChange={setIsOn} />
 * <Toggle label="Enable notifications" checked={enabled} onChange={setEnabled} />
 */

export interface ToggleProps {
  /** Toggle checked state */
  checked: boolean;

  /** Change handler */
  onChange: (checked: boolean) => void;

  /** Toggle label */
  label?: string;

  /** Label position */
  labelPosition?: 'left' | 'right';

  /** Toggle size */
  size?: 'sm' | 'md' | 'lg';

  /** Disabled state */
  disabled?: boolean;

  /** Custom className */
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const config = sizeConfig[size];

  // Track classes
  const trackClasses = [
    config.track,
    'relative inline-flex items-center rounded-full',
    'transition-colors duration-medium cursor-pointer',
    checked ? 'bg-gold' : 'bg-card-h border border-border2',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');

  // Thumb classes
  const thumbClasses = [
    config.thumb,
    'inline-block rounded-full bg-bg shadow-lg',
    'transition-transform duration-medium',
    checked ? config.translate : 'translate-x-0.5',
  ].join(' ');

  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      {label && labelPosition === 'left' && (
        <span className={`text-sm font-medium ${disabled ? 'text-text-3' : 'text-text-2'}`}>
          {label}
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={trackClasses}
      >
        <span className={thumbClasses} />
      </button>

      {label && labelPosition === 'right' && (
        <span className={`text-sm font-medium ${disabled ? 'text-text-3' : 'text-text-2'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
