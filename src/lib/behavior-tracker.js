/**
 * Behavior Tracker Service
 * 
 * Tracks user interactions (book views and searches) for the recommendation system.
 * Features:
 * - Debouncing to prevent excessive API calls
 * - Queue-based batching for performance
 * - Silent error handling (doesn't interrupt UX)
 */

class BehaviorTracker {
  constructor() {
    this.queue = [];
    this.debounceTimers = {};
    this.flushInterval = null;
    this.isTracking = true;
    
    // Start auto-flush interval (every 5 seconds)
    this.startAutoFlush();
  }

  /**
   * Track a book view event
   * @param {string} bookId - The book's MongoDB ObjectId
   * @param {object} bookData - Book details (title, author, categories, tags)
   */
  async trackBookView(bookId, bookData) {
    if (!this.isTracking || !bookId) return;

    const event = {
      eventType: "view",
      bookId,
      timestamp: new Date().toISOString()
    };

    this.addToQueue(event);
  }

  /**
   * Track a search event
   * @param {string} query - The search query text
   * @param {object} filters - Applied filters (formats, yearRange, availability)
   */
  async trackSearch(query, filters = {}) {
    if (!this.isTracking || !query || query.trim().length === 0) return;

    const eventKey = `search_${query}`;
    
    // Debounce search tracking (300ms)
    if (this.debounceTimers[eventKey]) {
      clearTimeout(this.debounceTimers[eventKey]);
    }

    this.debounceTimers[eventKey] = setTimeout(() => {
      const event = {
        eventType: "search",
        searchQuery: query.trim(),
        searchFilters: filters,
        timestamp: new Date().toISOString()
      };

      this.addToQueue(event);
      delete this.debounceTimers[eventKey];
    }, 300);
  }

  /**
   * Add event to queue and flush if threshold reached
   */
  addToQueue(event) {
    this.queue.push(event);

    // Flush immediately if queue reaches 10 events
    if (this.queue.length >= 10) {
      this.flushQueue();
    }
  }

  /**
   * Send queued events to the server
   */
  async flushQueue() {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      // Send events one by one (could be optimized with batch endpoint)
      for (const event of eventsToSend) {
        await fetch("/api/student/books/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(event),
        });
      }
    } catch (error) {
      // Silent failure - log to console but don't interrupt user experience
      console.error("Failed to track events:", error);
      
      // Re-queue failed events (up to 5 retries)
      for (const event of eventsToSend) {
        if (!event.retryCount) event.retryCount = 0;
        if (event.retryCount < 5) {
          event.retryCount++;
          this.queue.push(event);
        }
      }
    }
  }

  /**
   * Start automatic queue flushing every 5 seconds
   */
  startAutoFlush() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flushQueue();
    }, 5000);
  }

  /**
   * Stop automatic queue flushing
   */
  stopAutoFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Enable tracking
   */
  enable() {
    this.isTracking = true;
  }

  /**
   * Disable tracking (useful for testing or privacy modes)
   */
  disable() {
    this.isTracking = false;
    this.queue = [];
    
    // Clear all debounce timers
    Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    this.debounceTimers = {};
  }

  /**
   * Cleanup - call when component unmounts
   */
  cleanup() {
    this.stopAutoFlush();
    this.flushQueue(); // Flush remaining events
    
    // Clear all debounce timers
    Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    this.debounceTimers = {};
  }
}

// Create singleton instance
let trackerInstance = null;

/**
 * Get the behavior tracker instance (singleton)
 */
export function getBehaviorTracker() {
  if (typeof window === "undefined") {
    // Server-side rendering - return mock
    return {
      trackBookView: () => {},
      trackSearch: () => {},
      flushQueue: () => {},
      enable: () => {},
      disable: () => {},
      cleanup: () => {}
    };
  }

  if (!trackerInstance) {
    trackerInstance = new BehaviorTracker();
  }

  return trackerInstance;
}

/**
 * Hook for React components
 */
export function useBehaviorTracker() {
  return getBehaviorTracker();
}

export default getBehaviorTracker;
