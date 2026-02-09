// Auth Controller - Mock authentication endpoints

import { Request, Response } from 'express';

// In-memory storage (mock database)
interface User {
  id: string;
  email: string;
  password: string; // In production: hash with bcrypt
  name?: string;
  avatar?: string;
  walletAddress?: string;
  createdAt: string;
}

interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

const users: Map<string, User> = new Map();
const otpCodes: Map<string, OTPRecord> = new Map();
const tokens: Map<string, string> = new Map(); // token -> email

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate mock JWT token
function generateToken(email: string): string {
  return `mock_jwt_${Buffer.from(email).toString('base64')}_${Date.now()}`;
}

/**
 * POST /api/auth/signup
 * Create new user account (sends OTP)
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, acceptTerms } = req.body;

    // Validation
    if (!email || !password || !acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpCodes.set(email, { email, otp, expiresAt, verified: false });

    // In production: Send OTP via email
    console.log(`📧 OTP for ${email}: ${otp}`);

    // Create user (not verified yet)
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      password, // In production: hash with bcrypt
      createdAt: new Date().toISOString(),
    };

    users.set(email, user);

    res.json({
      success: true,
      message: `OTP sent to ${email}. Check console for code.`,
      requiresOTP: true,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP code
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // 🚀 DEV MODE: Accept test OTP "111111" for quick debugging
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && otp === '111111') {
      console.log(`🔓 DEV MODE: Test OTP accepted for ${email}`);

      // Create user if doesn't exist (for testing)
      if (!users.has(email)) {
        const testUser: User = {
          id: `user_${Date.now()}`,
          email,
          password: 'test123',
          name: email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        users.set(email, testUser);
      }

      const user = users.get(email)!;
      const token = generateToken(email);
      tokens.set(token, email);

      return res.json({
        success: true,
        message: 'OTP verified (dev mode)',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          walletAddress: user.walletAddress,
        },
      });
    }

    const otpRecord = otpCodes.get(email);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email',
      });
    }

    // Check expiration
    if (Date.now() > otpRecord.expiresAt) {
      otpCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    // Check OTP match
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code',
      });
    }

    // Mark as verified
    otpRecord.verified = true;

    // Get user
    const user = users.get(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate token
    const token = generateToken(email);
    tokens.set(token, email);

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/auth/login
 * Login existing user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Get user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password (in production: use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(email);
    tokens.set(token, email);

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Send password reset link
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user exists
    const user = users.get(email);
    if (!user) {
      // Don't reveal if user exists or not (security)
      return res.json({
        success: true,
        message: 'If an account exists, a reset link has been sent to your email',
      });
    }

    // In production: Generate reset token and send email
    console.log(`📧 Password reset link sent to ${email}`);

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/auth/social
 * Social authentication (Google / Wallet)
 */
export const socialAuth = async (req: Request, res: Response) => {
  try {
    const { provider, token, walletAddress } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider is required',
      });
    }

    // Mock social auth
    const email = `${provider}_${Date.now()}@example.com`;

    const user: User = {
      id: `user_${Date.now()}`,
      email,
      password: '', // No password for social auth
      walletAddress,
      createdAt: new Date().toISOString(),
    };

    users.set(email, user);

    // Generate token
    const authToken = generateToken(email);
    tokens.set(authToken, email);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: `${provider} authentication successful`,
      token: authToken,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Social auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      tokens.delete(token);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
