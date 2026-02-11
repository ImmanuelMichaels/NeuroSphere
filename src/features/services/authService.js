/**
 * Authentication Service
 * Handles login, logout, token management, and auth state
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'authUser',
  PROVIDER: 'authProvider',
  REFRESH_TOKEN: 'refreshToken',
  EXPIRY: 'tokenExpiry',
};

class AuthService {
  constructor() {
    this.token = this.getToken();
    this.user = this.getUser();
    this.provider = this.getProvider();
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.token, data.expiresIn);
      this.setUser(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  /**
   * Login with social provider (Google, GitHub, Microsoft, LinkedIn)
   */
  async socialLogin(provider, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `${provider} login failed`);
      }

      const data = await response.json();
      this.setToken(data.token, data.expiresIn);
      this.setUser(data.user);
      this.setProvider(provider);

      return { success: true, user: data.user };
    } catch (err) {
      console.error(`Social login error (${provider}):`, err);
      throw err;
    }
  }

  /**
   * Logout and clear auth state
   */
  logout() {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      }).catch(() => {});
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearAuth();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setToken(data.token, data.expiresIn);

      return data.token;
    } catch (err) {
      console.error('Token refresh error:', err);
      this.clearAuth();
      throw err;
    }
  }

  /**
   * Register new user
   */
  async register(email, password, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset request failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Password reset request error:', err);
      throw err;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      throw err;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email verification failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Email verification error:', err);
      throw err;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      this.setUser(data);
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      throw err;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const data = await response.json();
      this.setUser(data);
      return data;
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    const expiry = this.getTokenExpiry();
    if (!expiry) return true;

    // Check if token is expired
    if (new Date(expiry) < new Date()) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Storage helpers
  setToken(token, expiresIn) {
    this.token = token;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (expiresIn) {
      const expiry = new Date(Date.now() + expiresIn * 1000);
      localStorage.setItem(STORAGE_KEYS.EXPIRY, expiry.toISOString());
    }
  }

  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  }

  setRefreshToken(token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  getRefreshToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getUser() {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  setProvider(provider) {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
  }

  getProvider() {
    try {
      return localStorage.getItem(STORAGE_KEYS.PROVIDER);
    } catch {
      return null;
    }
  }

  getTokenExpiry() {
    try {
      return localStorage.getItem(STORAGE_KEYS.EXPIRY);
    } catch {
      return null;
    }
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.provider = null;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PROVIDER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRY);
  }
}

export default new AuthService();
