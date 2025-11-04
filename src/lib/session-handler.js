/**
 * Session Handler Utility
 * Manages client-side session validation, idle timeout, and cleanup
 */

// Configuration
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  WARNING_BEFORE_LOGOUT: 2 * 60 * 1000, // Show warning 2 minutes before logout
};

export function clearSessionStorage() {
  if (typeof window !== 'undefined') {
    // Clear any session-related data from localStorage/sessionStorage
    try {
      sessionStorage.clear();
      // Only clear session-related items from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('session') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error clearing session storage:', e);
    }
  }
}

export function getSessionAge() {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionStart = sessionStorage.getItem('session-start');
    if (!sessionStart) return null;
    
    const age = Date.now() - parseInt(sessionStart, 10);
    return age;
  } catch (e) {
    return null;
  }
}

export function markSessionStart() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('session-start', Date.now().toString());
      updateLastActivity(); // Also mark initial activity
    } catch (e) {
      console.error('Error marking session start:', e);
    }
  }
}

export function isSessionExpired() {
  const age = getSessionAge();
  if (!age) return false;
  
  return age > SESSION_CONFIG.MAX_AGE;
}

// Idle timeout functionality
export function updateLastActivity() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('last-activity', Date.now().toString());
    } catch (e) {
      console.error('Error updating last activity:', e);
    }
  }
}

export function getLastActivity() {
  if (typeof window === 'undefined') return null;
  
  try {
    const lastActivity = sessionStorage.getItem('last-activity');
    if (!lastActivity) return null;
    
    return parseInt(lastActivity, 10);
  } catch (e) {
    return null;
  }
}

export function getIdleTime() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return 0;
  
  return Date.now() - lastActivity;
}

export function isIdle() {
  const idleTime = getIdleTime();
  return idleTime > SESSION_CONFIG.IDLE_TIMEOUT;
}

export function shouldShowIdleWarning() {
  const idleTime = getIdleTime();
  const timeUntilLogout = SESSION_CONFIG.IDLE_TIMEOUT - idleTime;
  
  return timeUntilLogout > 0 && timeUntilLogout <= SESSION_CONFIG.WARNING_BEFORE_LOGOUT;
}

export function getTimeUntilIdleLogout() {
  const idleTime = getIdleTime();
  const remaining = SESSION_CONFIG.IDLE_TIMEOUT - idleTime;
  return Math.max(0, remaining);
}

export function getIdleTimeoutConfig() {
  return {
    idleTimeout: SESSION_CONFIG.IDLE_TIMEOUT,
    warningTime: SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
    maxAge: SESSION_CONFIG.MAX_AGE,
  };
}
