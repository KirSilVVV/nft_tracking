import React from 'react';
import '../../styles/loading.css';

// ============================================
// SPINNERS
// ============================================

interface SpinnerProps {
  type?: 'ring';
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ type = 'ring', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <div className={`spinner-ring ${sizeMap[size]}`}></div>;
};

// ============================================
// DASHBOARD WIDGET SKELETON
// ============================================

export const DashboardWidgetSkeleton: React.FC = () => (
  <div className="skeleton-widget">
    <div className="skeleton-widget-header">
      <div className="skeleton skeleton-widget-title"></div>
      <div className="skeleton skeleton-widget-icon"></div>
    </div>
    <div className="skeleton skeleton-widget-value"></div>
    <div className="skeleton skeleton-widget-subtitle"></div>
  </div>
);

export const DashboardGridSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <DashboardWidgetSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// CHART SKELETON
// ============================================

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="skeleton skeleton-widget-title mb-4"></div>
    <div className="skeleton skeleton-chart"></div>
  </div>
);

// ============================================
// TABLE SKELETON
// ============================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="skeleton skeleton-table-cell"></div>
        ))}
      </div>
    ))}
  </div>
);

// ============================================
// WHALE CARD SKELETON
// ============================================

export const WhaleCardSkeleton: React.FC = () => (
  <div className="skeleton-whale-card">
    <div className="skeleton skeleton-whale-avatar"></div>
    <div className="skeleton-whale-content">
      <div className="skeleton skeleton-whale-title"></div>
      <div className="skeleton skeleton-whale-subtitle"></div>
      <div className="skeleton-whale-stats">
        <div className="skeleton skeleton-whale-stat"></div>
        <div className="skeleton skeleton-whale-stat"></div>
        <div className="skeleton skeleton-whale-stat"></div>
      </div>
    </div>
  </div>
);

export const WhaleListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <WhaleCardSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title = 'No Data Found',
  message = 'There is no data to display at the moment.',
  actionLabel,
  onAction,
}) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3 className="empty-title">{title}</h3>
    <p className="empty-message">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// ============================================
// LOADING WRAPPER
// ============================================

interface LoadingWrapperProps {
  isLoading: boolean;
  isEmpty?: boolean;
  skeleton: React.ReactNode;
  emptyState?: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  isEmpty = false,
  skeleton,
  emptyState,
  children,
}) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
};
