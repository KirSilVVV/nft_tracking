// Auth Service - API calls for authentication

import axios from 'axios';
import type {
  SignUpRequest,
  LoginRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  SocialAuthRequest,
  AuthResponse,
} from '../types/auth.types';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';
const AUTH_API = `${API_BASE}/api/auth`;

// Local storage keys
const TOKEN_KEY = 'nft_tracker_token';
const USER_KEY = 'nft_tracker_user';

export const authService = {
  /**
   * Sign up new user (returns OTP required response)
   */
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${AUTH_API}/signup`, data);
    return response.data;
  },

  /**
   * Verify OTP code after signup
   */
  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${AUTH_API}/verify-otp`, data);

    // If successful, save token and user
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuth(response.data.token, response.data.user);
    }

    return response.data;
  },

  /**
   * Login existing user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${AUTH_API}/login`, data);

    // If successful, save token and user
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuth(response.data.token, response.data.user);
    }

    return response.data;
  },

  /**
   * Reset password (send reset link to email)
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${AUTH_API}/reset-password`, data);
    return response.data;
  },

  /**
   * Social auth (Google / Wallet)
   */
  async socialAuth(data: SocialAuthRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${AUTH_API}/social`, data);

    // If successful, save token and user
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuth(response.data.token, response.data.user);
    }

    return response.data;
  },

  /**
   * Logout (clear local storage)
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user
   */
  getUser(): any | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Save token and user to local storage
   */
  saveAuth(token: string, user: any): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
