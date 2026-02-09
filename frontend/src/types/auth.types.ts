// Authentication Types

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  walletAddress?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpRequest {
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface SocialAuthRequest {
  provider: 'google' | 'wallet';
  token?: string;
  walletAddress?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  requiresOTP?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth methods
  signUp: (data: SignUpRequest) => Promise<AuthResponse>;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  verifyOTP: (data: VerifyOTPRequest) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<AuthResponse>;
  socialAuth: (data: SocialAuthRequest) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
}
