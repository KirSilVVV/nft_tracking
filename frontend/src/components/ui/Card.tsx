import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 ATLAS CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design System: ATLAS
 * Variants: default, stat, feature, elevated
 * Hover: lift, glow, none
 *
 * Examples:
 * <Card>Content here</Card>
 * <Card variant="stat" hover="lift">Stats content</Card>
 * <Card variant="feature" accentColor="gold">Feature card</Card>
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card visual style */
  variant?: 'default' | 'stat' | 'feature' | 'elevated';

  /** Hover effect */
  hover?: 'lift' | 'glow' | 'none';

  /** Top accent line color (for feature cards) */
  accentColor?: 'gold' | 'cyan' | 'blue' | 'success' | 'error' | 'none';

  /** Rank glow (for top 3 whales) */
  rankGlow?: 1 | 2 | 3 | null;

  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Custom border */
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = 'lift',
  accentColor = 'none',
  rankGlow = null,
  padding = 'md',
  border = true,
  children,
  className = '',
  ...props
}) => {
  // Base classes
  const baseClasses = [
    'relative overflow-hidden',
    'transition-all duration-slow',
  ].join(' ');

  // Variant classes
  const variantClasses = {
    default: 'bg-card rounded-xl',
    stat: 'bg-card rounded-lg',
    feature: 'bg-card rounded-xl',
    elevated: 'bg-elev rounded-xl',
  };

  // Border
  const borderClass = border ? 'border border-border' : '';

  // Hover effect
  const hoverClasses = {
    lift: 'hover:border-border2 hover:-translate-y-1 hover:shadow-card',
    glow: 'hover:shadow-card hover:border-border2',
    none: '',
  };

  // Padding
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Rank glow (top 3)
  const rankGlowClass = rankGlow === 1 ? 'shadow-rank-1' : '';

  // Accent color (top border for feature cards)
  const accentColorMap = {
    gold: 'var(--gold)',
    cyan: 'var(--cyan)',
    blue: 'var(--blue)',
    success: 'var(--ok)',
    error: 'var(--no)',
    none: 'transparent',
  };

  const accentStyle = accentColor !== 'none' && variant === 'feature'
    ? {
        borderTop: `3px solid ${accentColorMap[accentColor]}`,
        borderRadius: 'var(--radius-xl)',
      }
    : undefined;

  // Combine all classes
  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    borderClass,
    hoverClasses[hover],
    paddingClasses[padding],
    rankGlowClass,
    className,
  ].join(' ');

  return (
    <div
      className={cardClasses}
      style={accentStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
