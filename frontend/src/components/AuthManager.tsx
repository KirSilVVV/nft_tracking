// AuthManager - Manages all auth modals and their state

import React, { useState } from 'react';
import SignUpModal from './auth/SignUpModal';
import LoginModal from './auth/LoginModal';
import OTPModal from './auth/OTPModal';
import ResetPasswordModal from './auth/ResetPasswordModal';
import SuccessModal from './auth/SuccessModal';

type ModalType = 'signup' | 'login' | 'otp' | 'reset' | 'success' | null;

interface AuthManagerProps {
  isOpen: boolean;
  initialModal?: ModalType;
  onClose: () => void;
  onNavigate?: (page: 'whales' | 'dashboard') => void;
}

const AuthManager: React.FC<AuthManagerProps> = ({ isOpen, initialModal = 'login', onClose, onNavigate }) => {
  const [currentModal, setCurrentModal] = useState<ModalType>(initialModal);
  const [otpEmail, setOtpEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState({
    title: 'Success!',
    message: 'Action completed successfully',
  });

  // Reset state when closed
  const handleClose = () => {
    setCurrentModal(initialModal);
    setOtpEmail('');
    onClose();
  };

  // Signup → OTP flow
  const handleOTPRequired = (email: string) => {
    setOtpEmail(email);
    setCurrentModal('otp');
  };

  // OTP → Success flow
  const handleOTPSuccess = () => {
    setSuccessMessage({
      title: 'Account Created!',
      message: 'Your account has been verified successfully. Welcome aboard!',
    });
    setCurrentModal('success');
  };

  // Login → Success flow
  const handleLoginSuccess = () => {
    setSuccessMessage({
      title: 'Welcome Back!',
      message: 'You have successfully logged in.',
    });
    setCurrentModal('success');
  };

  // Reset Password → Success flow
  const handleResetSuccess = () => {
    setSuccessMessage({
      title: 'Email Sent!',
      message: 'Check your inbox for password reset instructions.',
    });
    setCurrentModal('success');
  };

  // Switch between modals
  const switchToSignUp = () => setCurrentModal('signup');
  const switchToLogin = () => setCurrentModal('login');
  const switchToReset = () => setCurrentModal('reset');

  // Success modal close - navigate to dashboard
  const handleSuccessClose = () => {
    handleClose(); // Close all modals
    if (onNavigate) {
      onNavigate('dashboard'); // Navigate to dashboard
    }
  };

  return (
    <>
      <SignUpModal
        isOpen={isOpen && currentModal === 'signup'}
        onClose={handleClose}
        onSwitchToLogin={switchToLogin}
        onOTPRequired={handleOTPRequired}
      />

      <LoginModal
        isOpen={isOpen && currentModal === 'login'}
        onClose={handleClose}
        onSwitchToSignUp={switchToSignUp}
        onSwitchToReset={switchToReset}
        onSuccess={handleLoginSuccess}
      />

      <OTPModal
        isOpen={isOpen && currentModal === 'otp'}
        onClose={handleClose}
        email={otpEmail}
        onSuccess={handleOTPSuccess}
      />

      <ResetPasswordModal
        isOpen={isOpen && currentModal === 'reset'}
        onClose={handleClose}
        onSwitchToLogin={switchToLogin}
        onSuccess={handleResetSuccess}
      />

      <SuccessModal
        isOpen={isOpen && currentModal === 'success'}
        onClose={handleSuccessClose}
        title={successMessage.title}
        message={successMessage.message}
        redirectUrl="/dashboard"
      />
    </>
  );
};

export default AuthManager;
