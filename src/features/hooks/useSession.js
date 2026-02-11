import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

/**
 * useSession Hook
 * Manages user session lifecycle, timeout, and activity tracking
 */
const useSession = (options = {}) => {
  const {
    inactivityTimeout = 15 * 60 * 1000, // 15 minutes default
    warningTimeout = 2 * 60 * 1000, // 2 minutes before logout
    enableWarning = true,
  } = options;

  const [sessionActive, setSessionActive] = useState(() => authService.isAuthenticated());
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(inactivityTimeout);

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  /**
   * Reset inactivity timer on user activity
   */
  const resetActivityTimer = useCallback(() => {
    if (!sessionActive) return;

    setLastActivity(Date.now());
    setShowWarning(false);
    setTimeRemaining(inactivityTimeout);

    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Set warning timer
    if (enableWarning) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1000) {
              clearInterval(countdownIntervalRef.current);
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }, inactivityTimeout - warningTimeout);
    }

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, inactivityTimeout);
  }, [sessionActive, inactivityTimeout, warningTimeout, enableWarning]);

  /**
   * Handle session timeout
   */
  const handleSessionTimeout = useCallback(() => {
    setShowWarning(false);
    setSessionActive(false);
    authService.clearAuth();

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }, []);

  /**
   * Extend session when user confirms warning
   */
  const extendSession = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

  /**
   * End session manually
   */
  const endSession = useCallback(() => {
    setSessionActive(false);
    authService.logout();

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  /**
   * Get formatted time remaining
   */
  const getFormattedTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // Track user activity (mouse, keyboard, touch)
  useEffect(() => {
    if (!sessionActive) return;

    const handleActivity = () => {
      resetActivityTimer();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetActivityTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [sessionActive, resetActivityTimer]);

  // Check authentication status on mount
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    setSessionActive(isAuth);

    if (!isAuth) {
      handleSessionTimeout();
    }
  }, [handleSessionTimeout]);

  return {
    sessionActive,
    showWarning,
    timeRemaining,
    formattedTime: getFormattedTimeRemaining(),
    lastActivity,
    extendSession,
    endSession,
  };
};

export default useSession;
