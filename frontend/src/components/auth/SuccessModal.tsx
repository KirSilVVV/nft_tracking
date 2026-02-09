// SuccessModal - Success confirmation modal

import React, { useEffect } from 'react';
import '../../styles/auth-modals.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectUrl?: string;
  redirectDelay?: number; // Auto-redirect after N seconds
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Success!',
  message = 'Your account has been created successfully',
  redirectUrl,
  redirectDelay = 3,
}) => {
  // Auto-redirect after delay
  useEffect(() => {
    if (!isOpen || !redirectUrl) return;

    const timer = setTimeout(() => {
      onClose();
      // Redirect logic here (e.g., navigate to dashboard)
    }, redirectDelay * 1000);

    return () => clearTimeout(timer);
  }, [isOpen, redirectUrl, redirectDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
          <div className="success-icon">✓</div>
          <h2 className="modal-title">{title}</h2>
          <p className="modal-subtitle">{message}</p>
        </div>

        {/* Body */}
        <div className="modal-body">
          {redirectUrl ? (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Go to Dashboard →
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
