// OTPModal - OTP verification modal

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-modals.css';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ isOpen, onClose, email, onSuccess }) => {
  const { verifyOTP, isLoading, error, clearError } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend code
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) value = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').slice(0, 6);

    // Fill remaining with empty strings
    while (newOtp.length < 6) newOtp.push('');

    setOtp(newOtp);

    // Focus last filled input or submit if complete
    const lastFilledIndex = newOtp.findIndex((digit) => !digit);
    if (lastFilledIndex === -1) {
      handleSubmit(newOtp.join(''));
    } else {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    setLocalError(null);
    clearError();

    const otpCode = code || otp.join('');

    if (otpCode.length !== 6) {
      setLocalError('Please enter all 6 digits');
      return;
    }

    // Call API
    const result = await verifyOTP({ email, otp: otpCode });

    if (result.success) {
      onSuccess();
    } else {
      setLocalError(result.message || 'Invalid OTP code');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;

    // TODO: Call resend OTP API
    console.log('Resend OTP to:', email);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleClose = () => {
    setOtp(['', '', '', '', '', '']);
    setLocalError(null);
    clearError();
    setResendTimer(60);
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
          <div className="modal-icon icon-otp">📬</div>
          <h2 className="modal-title">Verify Email</h2>
          <p className="modal-subtitle">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* OTP Inputs */}
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                className={`otp-input ${digit ? 'filled' : ''} ${displayError ? 'error' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error */}
          {displayError && <div className="form-error active" style={{ textAlign: 'center' }}>{displayError}</div>}

          {/* Submit */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSubmit()}
            disabled={isLoading || otp.some((digit) => !digit)}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Verifying...
              </>
            ) : (
              'Verify Code →'
            )}
          </button>

          {/* Resend */}
          <div className="resend-code">
            Didn't receive code?{' '}
            <span
              className={`resend-link ${resendTimer > 0 ? 'disabled' : ''}`}
              onClick={handleResend}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
