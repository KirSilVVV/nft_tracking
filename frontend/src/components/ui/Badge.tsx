import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS BADGE COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Variants: gold, success, error, warning, mint, transfer, neutral
 * Shapes: pill (rounded), square
 *
 * Examples:
 * <Badge variant="gold">Whale</Badge>
 * <Badge variant="success">Buy</Badge>
 * <Badge variant="rank" rank={1}>1</Badge>
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge color variant */
  variant?: 'gold' | 'success' | 'error' | 'warning' | 'mint' | 'transfer' | 'neutral' | 'rank';

  /** Badge shape */
  shape?: 'pill' | 'square';

  /** Size */
  size?: 'sm' | 'md' | 'lg';

  /** Rank number (for rank badges) */
  rank?: 1 | 2 | 3 | null;

  /** Optional icon */
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  shape = 'pill',
  size = 'md',
  rank = null,
  icon,
  children,
  className = '',
  ...props
}) => {
  // Base classes
  const baseClasses = [
    'inline-flex items-center gap-1',
    'font-semibold uppercase tracking-wide',
    'transition-all duration-fast',
  ].join(' ');

  // Variant classes
  const variantClasses = {
    gold: 'bg-gold-light text-gold',
    success: 'bg-[var(--ok-d)] text-success',
    error: 'bg-[var(--no-d)] text-error',
    warning: 'bg-[var(--warn-d)] text-warning',
    mint: 'bg-[var(--tx-mint-bg)] text-[var(--tx-mint)]',
    transfer: 'bg-[var(--tx-transfer-bg)] text-[var(--tx-transfer)]',
    neutral: 'bg-card-h text-text-2 border border-border2',
    rank: '', // Handled separately
  };

  // Rank-specific classes
  const rankClasses = {
    1: 'bg-[var(--rank-1-bg)] text-rank-1',
    2: 'bg-[var(--rank-2-bg)] text-rank-2',
    3: 'bg-[var(--rank-3-bg)] text-rank-3',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  // Shape classes
  const shapeClasses = {
    pill: 'rounded-full',
    square: 'rounded-md',
  };

  // Special handling for rank badges
  const isRankBadge = variant === 'rank' && rank !== null;
  const rankSizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  // Combine classes
  let badgeClasses: string;

  if (isRankBadge) {
    badgeClasses = [
      'inline-flex items-center justify-center',
      'font-bold font-heading',
      'rounded-lg',
      rankSizeClasses[size],
      rankClasses[rank as 1 | 2 | 3],
      className,
    ].join(' ');
  } else {
    badgeClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      shapeClasses[shape],
      className,
    ].join(' ');
  }

  // Render rank badge
  if (isRankBadge) {
    return (
      <span className={badgeClasses} {...props}>
        {rank}
      </span>
    );
  }

  // Render regular badge
  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
