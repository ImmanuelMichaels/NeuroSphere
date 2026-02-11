import { useState, useCallback, useEffect } from 'react';
import authService from '../services/authService';

/**
 * useAuth Hook
 * Provides authentication state and methods
 */
const useAuth = () => {
  const [user, setUser] = useState(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Social login (Google, GitHub, Microsoft, LinkedIn)
   */
  const socialLogin = useCallback(async (provider, token) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.socialLogin(provider, token);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      const errorMessage = err.message || `${provider} login failed`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (email, password, name) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.register(email, password, name);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError('');
  }, []);

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.requestPasswordReset(email);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Password reset request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, password) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword(token, password);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get user profile
   */
  const getProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    setIsLoading(true);
    setError('');

    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Verify auth status on mount
  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUser(authService.getUser());
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    socialLogin,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    getProfile,
    updateProfile,
    clearError,
  };
};

export default useAuth;
