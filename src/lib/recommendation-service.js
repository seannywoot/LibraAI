/**
 * Recommendation Service
 * 
 * Provides caching and management for book recommendations.
 * Features:
 * - In-memory cache with TTL (5 minutes)
 * - Cache by user and context
 * - Background refresh while serving cached data
 */

class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 30 * 1000; // 30 seconds (reduced from 5 minutes for real-time updates)
  }

  /**
   * Get cache key for a request
   */
  getCacheKey(context, limit) {
    return `${context}_${limit}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.CACHE_TTL;
  }

  /**
   * Get recommendations with caching
   * @param {object} options - Request options
   * @param {string} options.context - "browse" or "search"
   * @param {number} options.limit - Maximum number of recommendations
   * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
   */
  async getRecommendations(options = {}) {
    const { context = "browse", limit = 10, forceRefresh = false } = options;
    const cacheKey = this.getCacheKey(context, limit);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        // Return cached data immediately
        // Optionally trigger background refresh
        this.refreshInBackground(options);
        return {
          ...cached.data,
          fromCache: true
        };
      }
    }

    // Fetch fresh data
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        context: context
      });

      const res = await fetch(`/api/student/books/recommendations?${params}`, {
        cache: "no-store"
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load recommendations");
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return {
        ...data,
        fromCache: false
      };
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn("Using stale cache due to fetch error:", error);
        return {
          ...cached.data,
          fromCache: true,
          stale: true
        };
      }

      throw error;
    }
  }

  /**
   * Refresh recommendations in the background
   */
  async refreshInBackground(options) {
    // Don't await - let it run in background
    setTimeout(async () => {
      try {
        await this.getRecommendations({ ...options, forceRefresh: true });
      } catch (error) {
        console.error("Background refresh failed:", error);
      }
    }, 100);
  }

  /**
   * Invalidate cache for a specific context or all
   */
  invalidateCache(context = null) {
    if (context) {
      // Invalidate specific context
      for (const key of this.cache.keys()) {
        if (key.startsWith(context)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalidate all
      this.cache.clear();
    }
  }

  /**
   * Get cached recommendations without fetching
   */
  getCachedRecommendations(context = "browse", limit = 10) {
    const cacheKey = this.getCacheKey(context, limit);
    const cached = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cached)) {
      return {
        ...cached.data,
        fromCache: true
      };
    }

    return null;
  }

  /**
   * Preload recommendations for faster access
   */
  async preload(contexts = ["browse", "search"], limit = 10) {
    const promises = contexts.map(context =>
      this.getRecommendations({ context, limit })
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Preload failed:", error);
    }
  }

  /**
   * Clear old cache entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
let serviceInstance = null;

/**
 * Get the recommendation service instance (singleton)
 */
export function getRecommendationService() {
  if (typeof window === "undefined") {
    // Server-side rendering - return mock
    return {
      getRecommendations: async () => ({ ok: false, recommendations: [] }),
      invalidateCache: () => {},
      getCachedRecommendations: () => null,
      preload: async () => {},
      cleanup: () => {}
    };
  }

  if (!serviceInstance) {
    serviceInstance = new RecommendationService();
    
    // Set up periodic cleanup (every 10 minutes)
    setInterval(() => {
      serviceInstance.cleanup();
    }, 10 * 60 * 1000);
  }

  return serviceInstance;
}

export default getRecommendationService;
