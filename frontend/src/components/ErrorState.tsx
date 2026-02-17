// ErrorState - Component for displaying error states with retry option

import React from 'react';
import '../styles/ErrorState.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  showRetry?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Temporarily Unavailable',
  message = 'Unable to fetch data from the blockchain. This could be due to network issues or API rate limits.',
  onRetry,
  retrying = false,
  showRetry = true,
}) => {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠️</div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>

      {showRetry && onRetry && (
        <button
          className="error-state-retry-btn"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? (
            <>
              <span className="spinner-icon">⏳</span> Retrying...
            </>
          ) : (
            <>
              <span className="retry-icon">🔄</span> Try Again
            </>
          )}
        </button>
      )}

      <div className="error-state-footer">
        <p className="error-state-help">
          If the problem persists, check{' '}
          <a
            href="https://status.alchemy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="error-state-link"
          >
            Alchemy API Status
          </a>
        </p>
      </div>
    </div>
  );
};

export default ErrorState;
