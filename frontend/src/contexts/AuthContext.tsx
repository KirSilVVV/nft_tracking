// AuthContext - Global authentication state management

import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  AuthContextType,
  SignUpRequest,
  LoginRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  SocialAuthRequest,
  AuthResponse,
} from '../types/auth.types';
import { authService } from '../services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize: check if user is already logged in
  useEffect(() => {
    const storedUser = authService.getUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Sign up (creates account, sends OTP)
  const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.signUp(data);

      if (!response.success) {
        setError(response.message || 'Sign up failed');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Sign up failed. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP (completes registration)
  const verifyOTP = async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.verifyOTP(data);

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setError(response.message || 'Invalid OTP code');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(data);

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setError(response.message || 'Invalid credentials');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.resetPassword(data);

      if (!response.success) {
        setError(response.message || 'Reset password failed');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Social auth (Google / Wallet)
  const socialAuth = async (data: SocialAuthRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.socialAuth(data);

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setError(response.message || 'Social authentication failed');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Social authentication failed. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signUp,
    login,
    verifyOTP,
    resetPassword,
    socialAuth,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
