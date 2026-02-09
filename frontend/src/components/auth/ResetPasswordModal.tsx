// ResetPasswordModal - Password reset request modal

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-modals.css';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSuccess,
}) => {
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    // Call API
    const result = await resetPassword({ email });

    if (result.success) {
      // Show success message
      onSuccess();
    } else {
      setLocalError(result.message || 'Failed to send reset link');
    }
  };

  const handleClose = () => {
    setEmail('');
    setLocalError(null);
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
          <div className="modal-icon icon-reset">🔄</div>
          <h2 className="modal-title">Reset Password</h2>
          <p className="modal-subtitle">We'll send a reset link to your email</p>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  className={`form-input ${displayError ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Error */}
            {displayError && <div className="form-error active">{displayError}</div>}

            {/* Submit */}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link →'
              )}
            </button>

            {/* Back to Login */}
            <button type="button" className="btn btn-ghost" onClick={onSwitchToLogin} style={{ marginTop: '12px' }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
