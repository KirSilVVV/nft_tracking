// ============================================
// LOADING COMPONENTS FOR NFT-TRACKER
// ATLAS Design System - Dark Theme
// ============================================

import React from 'react';
import '../../styles/loading.css';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SpinnerVariant = 'ring' | 'dots' | 'pulse' | 'whale' | 'dual' | 'bar';
export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  className?: string;
}

export interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  className?: string;
}

export interface BlockchainLoaderProps {
  title?: string;
  message?: string;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export interface LoadingWrapperProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

// ============================================
// 1. SPINNER COMPONENT
// ============================================

export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'ring',
  size = 'md',
  className = ''
}) => {
  const sizeMap: Record<SpinnerSize, string> = {
    sm: '24px',
    md: '48px',
    lg: '64px'
  };

  const dimension = sizeMap[size];

  const renderSpinner = () => {
    switch (variant) {
      case 'ring':
        return <div className={`spinner-ring ${className}`} style={{ width: dimension, height: dimension }} />;

      case 'dots':
        return (
          <div className={`spinner-dots ${className}`}>
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        );

      case 'pulse':
        return <div className={`spinner-pulse ${className}`} style={{ width: dimension, height: dimension }} />;

      case 'whale':
        return <div className={`spinner-whale ${className}`} style={{ fontSize: dimension }}>🐋</div>;

      case 'dual':
        return <div className={`spinner-dual ${className}`} style={{ width: dimension, height: dimension }} />;

      case 'bar':
        return <div className={`spinner-bar ${className}`} />;

      default:
        return <div className={`spinner-ring ${className}`} style={{ width: dimension, height: dimension }} />;
    }
  };

  return <div className="spinner-container">{renderSpinner()}</div>;
};

// ============================================
// 2. PROGRESS BAR
// ============================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  className = ''
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`progress-bar-container ${className}`}>
      {showLabel && <span className="progress-label">{clampedProgress.toFixed(0)}%</span>}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// 3. NFT CARD SKELETON
// ============================================

export const NFTCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card skeleton-nft ${className}`}>
    <div className="skeleton skeleton-nft-image" />
    <div className="skeleton skeleton-nft-title" />
    <div className="skeleton skeleton-nft-subtitle" />
    <div className="skeleton-nft-footer">
      <div className="skeleton skeleton-nft-price" />
      <div className="skeleton skeleton-nft-badge" />
    </div>
  </div>
);

// ============================================
// 4. NFT GRID SKELETON
// ============================================

export const NFTGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className = ''
}) => (
  <div className={`grid grid-3 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <NFTCardSkeleton key={index} />
    ))}
  </div>
);

// ============================================
// 5. TRANSACTION SKELETON
// ============================================

export const TransactionSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-transaction ${className}`}>
    <div className="skeleton skeleton-tx-icon" />
    <div className="skeleton-tx-content">
      <div className="skeleton skeleton-tx-title" />
      <div className="skeleton skeleton-tx-subtitle" />
    </div>
    <div className="skeleton skeleton-tx-amount" />
  </div>
);

// ============================================
// 6. TRANSACTION LIST SKELETON
// ============================================

export const TransactionListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className = ''
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, index) => (
      <TransactionSkeleton key={index} />
    ))}
  </div>
);

// ============================================
// 7. DASHBOARD WIDGET SKELETON
// ============================================

export const DashboardWidgetSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-widget ${className}`}>
    <div className="skeleton-widget-header">
      <div className="skeleton skeleton-widget-title" />
      <div className="skeleton skeleton-widget-icon" />
    </div>
    <div className="skeleton skeleton-widget-value" />
    <div className="skeleton skeleton-widget-change" />
    <div className="skeleton skeleton-widget-chart" />
  </div>
);

// ============================================
// 8. DASHBOARD SKELETON
// ============================================

export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-2 ${className}`}>
    <DashboardWidgetSkeleton />
    <DashboardWidgetSkeleton />
    <DashboardWidgetSkeleton />
    <DashboardWidgetSkeleton />
  </div>
);

// ============================================
// 9. TABLE SKELETON
// ============================================

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = ''
}) => (
  <div className={`skeleton-table ${className}`}>
    <div
      className="skeleton-table-header"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: cols }).map((_, index) => (
        <div key={index} className="skeleton skeleton-table-header-cell" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="skeleton-table-row"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="skeleton skeleton-table-cell" />
        ))}
      </div>
    ))}
  </div>
);

// ============================================
// 10. BLOCKCHAIN LOADER
// ============================================

export const BlockchainLoader: React.FC<BlockchainLoaderProps> = ({
  title = 'Processing Blockchain Data',
  message = 'Please wait...',
  currentStep = 0,
  totalSteps = 4,
  className = ''
}) => (
  <div className={`blockchain-loader ${className}`}>
    <div className="blockchain-icon">⛓️</div>
    <div className="blockchain-title">{title}</div>
    <div className="blockchain-message">{message}</div>
    {totalSteps > 0 && (
      <div className="blockchain-steps">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`blockchain-step ${
              index < currentStep ? 'complete' :
              index === currentStep ? 'active' : ''
            }`}
          />
        ))}
      </div>
    )}
  </div>
);

// ============================================
// 11. WHALE CARD SKELETON
// ============================================

export const WhaleCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="skeleton-widget-header">
      <div className="skeleton skeleton-widget-icon" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-widget-title" style={{ marginBottom: '8px' }} />
        <div className="skeleton skeleton-widget-subtitle" style={{ width: '60%' }} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
      <div className="skeleton skeleton-widget-value" />
      <div className="skeleton skeleton-widget-value" />
      <div className="skeleton skeleton-widget-value" />
    </div>
    <div className="skeleton" style={{ height: '8px', marginTop: '20px', borderRadius: '4px' }} />
  </div>
);

// ============================================
// 12. WHALE LIST SKELETON
// ============================================

export const WhaleListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className = ''
}) => (
  <div className={`whales-grid ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <WhaleCardSkeleton key={index} />
    ))}
  </div>
);

// ============================================
// 13. EMPTY STATE
// ============================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  message,
  actionLabel,
  onAction,
  className = ''
}) => (
  <div className={`empty-state ${className}`}>
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    <div className="empty-message">{message}</div>
    {actionLabel && onAction && (
      <button className="btn btn-primary" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

// ============================================
// 14. LOADING WRAPPER
// ============================================

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  skeleton,
  children,
  delay = 300
}) => {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSkeleton(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [loading, delay]);

  if (showSkeleton) return <>{skeleton}</>;
  return <>{children}</>;
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  Spinner,
  ProgressBar,
  NFTCardSkeleton,
  NFTGridSkeleton,
  TransactionSkeleton,
  TransactionListSkeleton,
  DashboardWidgetSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  BlockchainLoader,
  WhaleCardSkeleton,
  WhaleListSkeleton,
  EmptyState,
  LoadingWrapper
};
