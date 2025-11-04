/**
 * Simple Rate Limiter for API Endpoints
 * 
 * Implements in-memory rate limiting to prevent abuse
 * and ensure fair resource usage.
 */

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   * @param {string} identifier - User identifier (email, IP, etc.)
   * @returns {object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  checkLimit(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetAt = new Date(oldestRequest + this.windowMs);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000)
      };
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetAt: new Date(now + this.windowMs)
    };
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }

  /**
   * Reset limits for a specific identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    return {
      used: recentRequests.length,
      limit: this.maxRequests,
      remaining: this.maxRequests - recentRequests.length
    };
  }
}

// Create rate limiters for different endpoints
const trackingLimiter = new RateLimiter(100, 60000); // 100 requests per minute
const recommendationsLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Middleware to check rate limits
 * @param {string} limiterType - 'tracking' or 'recommendations'
 * @param {string} identifier - User identifier
 * @returns {object} Rate limit result
 */
export function checkRateLimit(limiterType, identifier) {
  const limiter = limiterType === 'tracking' ? trackingLimiter : recommendationsLimiter;
  return limiter.checkLimit(identifier);
}

/**
 * Get rate limiter instance
 */
export function getRateLimiter(type) {
  return type === 'tracking' ? trackingLimiter : recommendationsLimiter;
}

export default checkRateLimit;
