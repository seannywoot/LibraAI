/**
 * User Interaction Tracker
 * Tracks user behavior for improved recommendations
 */

import clientPromise from "@/lib/mongodb";

/**
 * Track user interaction with books
 * @param {Object} params - Interaction parameters
 * @param {string} params.userId - User email
 * @param {string} params.eventType - Type of event (view, search, borrow, bookmark, note, return, complete)
 * @param {Object} params.metadata - Additional event metadata
 */
export async function trackInteraction({ userId, eventType, metadata = {} }) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    // Get user ObjectId
    const user = await users.findOne({ email: userId });
    if (!user) {
      console.warn(`User not found for interaction tracking: ${userId}`);
      return { ok: false, error: "User not found" };
    }

    // Build interaction document
    const interaction = {
      userId: user._id,
      userEmail: userId,
      eventType,
      timestamp: new Date(),
      ...metadata,
    };

    // Add session context
    if (metadata.sessionId) {
      interaction.sessionId = metadata.sessionId;
    }

    // Insert interaction
    await interactions.insertOne(interaction);

    return { ok: true };
  } catch (error) {
    console.error("Failed to track interaction:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Track book view
 */
export async function trackBookView({ userId, bookId, bookTitle, bookAuthor, bookCategories, bookTags, bookFormat, bookPublisher, bookYear }) {
  return trackInteraction({
    userId,
    eventType: "view",
    metadata: {
      bookId,
      bookTitle,
      bookAuthor,
      bookCategories,
      bookTags,
      bookFormat,
      bookPublisher,
      bookYear,
    },
  });
}

/**
 * Track search query
 */
export async function trackSearch({ userId, searchQuery, searchFilters, resultCount }) {
  return trackInteraction({
    userId,
    eventType: "search",
    metadata: {
      searchQuery,
      searchFilters,
      resultCount,
    },
  });
}

/**
 * Track book borrow
 */
export async function trackBorrow({ userId, bookId, bookTitle, bookAuthor, bookCategories, loanDays }) {
  return trackInteraction({
    userId,
    eventType: "borrow",
    metadata: {
      bookId,
      bookTitle,
      bookAuthor,
      bookCategories,
      loanDays,
    },
  });
}

/**
 * Track book return
 */
export async function trackReturn({ userId, bookId, bookTitle, daysKept, wasOverdue }) {
  return trackInteraction({
    userId,
    eventType: "return",
    metadata: {
      bookId,
      bookTitle,
      daysKept,
      wasOverdue,
    },
  });
}

/**
 * Track bookmark
 */
export async function trackBookmark({ userId, bookId, bookTitle, action }) {
  return trackInteraction({
    userId,
    eventType: action === "add" ? "bookmark_add" : "bookmark_remove",
    metadata: {
      bookId,
      bookTitle,
    },
  });
}

/**
 * Track note creation/update
 */
export async function trackNote({ userId, bookId, bookTitle, action, noteLength }) {
  return trackInteraction({
    userId,
    eventType: action === "create" ? "note_create" : "note_update",
    metadata: {
      bookId,
      bookTitle,
      noteLength,
    },
  });
}

/**
 * Track reading completion
 */
export async function trackReadingComplete({ userId, bookId, bookTitle, bookCategories, readingTimeMinutes }) {
  return trackInteraction({
    userId,
    eventType: "complete",
    metadata: {
      bookId,
      bookTitle,
      bookCategories,
      readingTimeMinutes,
    },
  });
}

/**
 * Get user interaction summary
 */
export async function getUserInteractionSummary(userId, days = 90) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    const user = await users.findOne({ email: userId });
    if (!user) {
      return null;
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const summary = await interactions
      .aggregate([
        {
          $match: {
            userId: user._id,
            timestamp: { $gte: cutoffDate },
          },
        },
        {
          $group: {
            _id: "$eventType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return summary.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to get interaction summary:", error);
    return null;
  }
}

/**
 * Clean up old interactions (keep last 180 days)
 */
export async function cleanupOldInteractions() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const interactions = db.collection("user_interactions");

    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const result = await interactions.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return { ok: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Failed to cleanup interactions:", error);
    return { ok: false, error: error.message };
  }
}
