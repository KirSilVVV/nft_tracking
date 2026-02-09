// LoginModal - User login modal

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-modals.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToReset: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSwitchToReset,
  onSuccess,
}) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

    // Call API
    const result = await login({ email, password, rememberMe });

    if (result.success) {
      // Login successful - show success modal
      onSuccess();
    } else {
      setLocalError(result.message || 'Invalid credentials');
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'wallet') => {
    // TODO: Implement social auth flow
    console.log(`Social auth: ${provider}`);
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
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
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Sign in to access your NFT dashboard</p>
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

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="checkbox-group" style={{ margin: 0 }}>
                <div
                  className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}
                  onClick={() => setRememberMe(!rememberMe)}
                />
                <label className="checkbox-label" onClick={() => setRememberMe(!rememberMe)}>
                  Remember me
                </label>
              </div>
              <a
                onClick={onSwitchToReset}
                style={{ fontSize: '13px', color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }}
              >
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {displayError && <div className="form-error active">{displayError}</div>}

            {/* Submit */}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Signing In...
                </>
              ) : (
                'Sign In →'
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
            Don't have an account?{' '}
            <a onClick={onSwitchToSignUp}>Create Account</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
