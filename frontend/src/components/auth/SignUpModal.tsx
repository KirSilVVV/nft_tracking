// SignUpModal - User registration modal

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-modals.css';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onOTPRequired: (email: string) => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSwitchToLogin, onOTPRequired }) => {
  const { signUp, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (!acceptTerms) {
      setLocalError('Please accept Terms & Conditions');
      return;
    }

    // Call API
    const result = await signUp({ email, password, acceptTerms });

    if (result.success && result.requiresOTP) {
      // Show OTP modal
      onOTPRequired(email);
    } else if (!result.success) {
      setLocalError(result.message || 'Sign up failed');
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'wallet') => {
    // TODO: Implement social auth flow
    console.log(`Social auth: ${provider}`);
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setAcceptTerms(false);
    setShowPassword(false);
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
          <div className="modal-icon icon-auth">🔐</div>
          <h2 className="modal-title">Create Account</h2>
          <p className="modal-subtitle">Join the NFT whale tracking revolution</p>
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
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${displayError ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="checkbox-group">
              <div
                className={`custom-checkbox ${acceptTerms ? 'checked' : ''}`}
                onClick={() => setAcceptTerms(!acceptTerms)}
              />
              <label className="checkbox-label" onClick={() => setAcceptTerms(!acceptTerms)}>
                I agree to the{' '}
                <a href="#" style={{ color: 'var(--gold)' }}>
                  Terms & Conditions
                </a>
              </label>
            </div>

            {/* Error */}
            {displayError && <div className="form-error active">{displayError}</div>}

            {/* Submit */}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Creating Account...
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">or continue with</div>

          {/* Social Login */}
          <button className="btn btn-social" onClick={() => handleSocialAuth('google')}>
            <span className="icon">🌐</span>
            Google
          </button>
          <button className="btn btn-social" onClick={() => handleSocialAuth('wallet')}>
            <span className="icon">👛</span>
            Connect Wallet
          </button>

          {/* Footer */}
          <div className="modal-footer">
            Already have an account?{' '}
            <a onClick={onSwitchToLogin}>Log In</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
