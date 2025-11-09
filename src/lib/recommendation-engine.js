/**
 * Advanced Recommendation Engine
 * Combines multiple strategies for personalized book recommendations
 */

import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Main recommendation function
 */
export async function getRecommendations({
  userId,
  limit = 10,
  excludeBookIds = [],
  context = "browse",
  bookId = null,
}) {
  const client = await clientPromise;
  const db = client.db();

  // Get user
  const users = db.collection("users");
  const user = await users.findOne({ email: userId });

  if (!user) {
    return getPopularRecommendations(db, limit);
  }

  // If bookId provided, get similar books
  if (bookId) {
    return getSimilarBooks(db, bookId, limit, excludeBookIds);
  }

  // Get user profile
  const profile = await buildUserProfile(db, user._id);

  if (!profile || profile.totalInteractions === 0) {
    return getPopularRecommendations(db, limit);
  }

  // Get candidate books using multiple strategies
  const candidates = await getCandidateBooks(db, profile, user._id, excludeBookIds);

  if (candidates.length === 0) {
    return getPopularRecommendations(db, limit);
  }

  // Score and rank candidates
  const scored = scoreBooks(candidates, profile);

  // Apply diversity filter
  const diverse = applyDiversityFilter(scored, profile.diversityScore);

  // Return top recommendations
  return {
    recommendations: diverse.slice(0, limit),
    profile: {
      totalInteractions: profile.totalInteractions,
      topCategories: profile.topCategories.slice(0, 3),
      topAuthors: profile.topAuthors.slice(0, 3),
      diversityScore: Math.round(profile.diversityScore * 100),
      engagementLevel: profile.engagementLevel,
    },
  };
}

/**
 * Build comprehensive user profile from all behavior data
 */
async function buildUserProfile(db, userId) {
  const interactions = db.collection("user_interactions");
  const transactions = db.collection("transactions");
  const bookmarks = db.collection("bookmarks");
  const notes = db.collection("notes");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get all interactions
  const userInteractions = await interactions
    .find({
      userId,
      timestamp: { $gte: ninetyDaysAgo },
    })
    .sort({ timestamp: -1 })
    .toArray();

  // Get borrowing history
  const borrowHistory = await transactions
    .find({
      userId,
      status: { $in: ["borrowed", "returned"] },
      borrowedAt: { $gte: ninetyDaysAgo },
    })
    .toArray();

  // Get bookmarked books
  const bookmarkedBooks = await bookmarks
    .find({ userId })
    .toArray();

  // Get books with notes
  const notedBooks = await notes
    .find({ userId })
    .toArray();

  // Analyze data
  const categories = [];
  const tags = [];
  const authors = [];
  const publishers = [];
  const formats = [];
  const years = [];
  const bookIds = new Set();

  // Weight multipliers
  const weights = {
    complete: 10,    // Finished reading
    borrow: 8,       // Borrowed book
    note_create: 6,  // Created note
    bookmark_add: 5, // Bookmarked
    view: 1,         // Viewed book
    search: 0.5,     // Search query
  };

  // Process interactions with time decay
  for (const interaction of userInteractions) {
    const timestamp = new Date(interaction.timestamp);
    let timeDecay = 1;

    if (timestamp >= sevenDaysAgo) {
      timeDecay = 3;
    } else if (timestamp >= thirtyDaysAgo) {
      timeDecay = 2;
    } else {
      timeDecay = 1.5;
    }

    const eventWeight = weights[interaction.eventType] || 1;
    const totalWeight = Math.round(eventWeight * timeDecay);

    // Track book interactions
    if (interaction.bookId) {
      bookIds.add(interaction.bookId.toString());
    }

    // Extract features
    if (interaction.bookCategories) {
      for (let i = 0; i < totalWeight; i++) {
        categories.push(...interaction.bookCategories);
      }
    }

    if (interaction.bookTags) {
      for (let i = 0; i < totalWeight; i++) {
        tags.push(...interaction.bookTags);
      }
    }

    if (interaction.bookAuthor) {
      for (let i = 0; i < totalWeight; i++) {
        authors.push(interaction.bookAuthor);
      }
    }

    if (interaction.bookPublisher) {
      for (let i = 0; i < totalWeight; i++) {
        publishers.push(interaction.bookPublisher);
      }
    }

    if (interaction.bookFormat) {
      for (let i = 0; i < totalWeight; i++) {
        formats.push(interaction.bookFormat);
      }
    }

    if (interaction.bookYear) {
      for (let i = 0; i < totalWeight; i++) {
        years.push(interaction.bookYear);
      }
    }
  }

  // Process borrowing history (high signal)
  for (const transaction of borrowHistory) {
    const weight = transaction.status === "returned" ? 12 : 8;
    
    if (transaction.bookCategories) {
      for (let i = 0; i < weight; i++) {
        categories.push(...transaction.bookCategories);
      }
    }

    if (transaction.bookAuthor) {
      for (let i = 0; i < weight; i++) {
        authors.push(transaction.bookAuthor);
      }
    }
  }

  // Calculate engagement metrics
  const totalInteractions = userInteractions.length;
  const recentInteractions = userInteractions.filter(
    (i) => new Date(i.timestamp) >= sevenDaysAgo
  ).length;

  const borrowCount = borrowHistory.length;
  const bookmarkCount = bookmarkedBooks.length;
  const noteCount = notedBooks.length;

  // Engagement level: low, medium, high, power
  let engagementLevel = "low";
  const engagementScore = borrowCount * 3 + bookmarkCount * 2 + noteCount * 2 + totalInteractions;

  if (engagementScore > 100) {
    engagementLevel = "power";
  } else if (engagementScore > 50) {
    engagementLevel = "high";
  } else if (engagementScore > 20) {
    engagementLevel = "medium";
  }

  // Get top items
  const topCategories = getTopItems(categories, 10);
  const topTags = getTopItems(tags, 12);
  const topAuthors = getTopItems(authors, 8);
  const topPublishers = getTopItems(publishers, 5);
  const topFormats = getTopItems(formats, 3);

  // Calculate average preferred year
  const avgYear = years.length > 0
    ? Math.round(years.reduce((sum, y) => sum + y, 0) / years.length)
    : null;

  // Calculate diversity score
  const diversityScore = calculateDiversityScore(categories, tags, authors);

  return {
    topCategories,
    topTags,
    topAuthors,
    topPublishers,
    topFormats,
    avgPreferredYear: avgYear,
    diversityScore,
    totalInteractions,
    recentInteractions,
    borrowCount,
    bookmarkCount,
    noteCount,
    engagementLevel,
    engagementScore,
    uniqueBooksInteracted: bookIds.size,
  };
}

/**
 * Get candidate books using multiple strategies
 */
async function getCandidateBooks(db, profile, userId, excludeBookIds) {
  const books = db.collection("books");
  const personalLibraries = db.collection("personal_libraries");
  const transactions = db.collection("transactions");

  // Get books to exclude
  const [libraryBooks, borrowedBooks] = await Promise.all([
    personalLibraries.find({ userId }).project({ isbn: 1, title: 1 }).toArray(),
    transactions.find({ userId, status: { $in: ["borrowed", "pending-approval"] } }).project({ bookId: 1 }).toArray(),
  ]);

  const excludeIsbns = libraryBooks.map((b) => b.isbn).filter(Boolean);
  const excludeTitles = libraryBooks.map((b) => b.title).filter(Boolean);
  const excludeIds = [
    ...excludeBookIds.map((id) => new ObjectId(id)),
    ...borrowedBooks.map((b) => b.bookId),
  ];

  // Build queries for different strategies
  const queries = [];

  // Strategy 1: Content-based (categories, tags, authors)
  if (profile.topCategories.length > 0 || profile.topTags.length > 0 || profile.topAuthors.length > 0) {
    queries.push({
      $or: [
        { categories: { $in: profile.topCategories } },
        { tags: { $in: profile.topTags } },
        { author: { $in: profile.topAuthors } },
      ],
      status: "available",
    });
  }

  // Strategy 2: Collaborative filtering (users who borrowed X also borrowed Y)
  const collaborativeBooks = await getCollaborativeRecommendations(db, userId, profile);
  if (collaborativeBooks.length > 0) {
    queries.push({
      _id: { $in: collaborativeBooks.map((id) => new ObjectId(id)) },
      status: "available",
    });
  }

  // Strategy 3: Publisher-based
  if (profile.topPublishers.length > 0) {
    queries.push({
      publisher: { $in: profile.topPublishers },
      status: "available",
    });
  }

  // Strategy 4: Format preferences
  if (profile.topFormats.length > 0) {
    queries.push({
      format: { $in: profile.topFormats },
      status: "available",
    });
  }

  // Strategy 5: Year-based (recency bias)
  if (profile.avgPreferredYear) {
    queries.push({
      year: {
        $gte: profile.avgPreferredYear - 10,
        $lte: profile.avgPreferredYear + 10,
      },
      status: "available",
    });
  }

  // Combine strategies
  const baseQuery = queries.length > 0 ? { $or: queries } : { status: "available" };

  // Add exclusions
  const excludeConditions = [];
  if (excludeIsbns.length > 0) {
    excludeConditions.push({ isbn: { $nin: excludeIsbns } });
  }
  if (excludeTitles.length > 0) {
    excludeConditions.push({ title: { $nin: excludeTitles } });
  }
  if (excludeIds.length > 0) {
    excludeConditions.push({ _id: { $nin: excludeIds } });
  }

  const finalQuery = excludeConditions.length > 0
    ? { $and: [baseQuery, ...excludeConditions] }
    : baseQuery;

  // Fetch candidates
  const candidates = await books
    .find(finalQuery)
    .limit(100) // Get more for better scoring
    .toArray();

  return candidates;
}

/**
 * Collaborative filtering: find books borrowed by similar users
 */
async function getCollaborativeRecommendations(db, userId, profile, limit = 20) {
  const transactions = db.collection("transactions");
  const interactions = db.collection("user_interactions");

  // Get user's borrowed books
  const userBooks = await transactions
    .find({
      userId,
      status: { $in: ["borrowed", "returned"] },
    })
    .project({ bookId: 1, bookTitle: 1 })
    .toArray();

  if (userBooks.length === 0) {
    return [];
  }

  const userBookIds = userBooks.map((b) => b.bookId.toString());

  // Find other users who borrowed the same books
  const similarUsers = await transactions
    .aggregate([
      {
        $match: {
          bookId: { $in: userBooks.map((b) => b.bookId) },
          userId: { $ne: userId },
          status: { $in: ["borrowed", "returned"] },
        },
      },
      {
        $group: {
          _id: "$userId",
          commonBooks: { $addToSet: "$bookId" },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 2 }, // At least 2 books in common
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10, // Top 10 similar users
      },
    ])
    .toArray();

  if (similarUsers.length === 0) {
    return [];
  }

  const similarUserIds = similarUsers.map((u) => u._id);

  // Get books borrowed by similar users (that current user hasn't borrowed)
  const recommendations = await transactions
    .aggregate([
      {
        $match: {
          userId: { $in: similarUserIds },
          status: { $in: ["borrowed", "returned"] },
        },
      },
      {
        $group: {
          _id: "$bookId",
          borrowCount: { $sum: 1 },
          users: { $addToSet: "$userId" },
        },
      },
      {
        $match: {
          borrowCount: { $gte: 2 }, // Borrowed by at least 2 similar users
        },
      },
      {
        $sort: { borrowCount: -1 },
      },
      {
        $limit: limit,
      },
    ])
    .toArray();

  // Filter out books user already borrowed
  return recommendations
    .map((r) => r._id.toString())
    .filter((id) => !userBookIds.includes(id));
}

/**
 * Score books based on user profile
 */
function scoreBooks(books, profile) {
  return books.map((book) => {
    let score = 0;
    const matchReasons = [];

    // Category matching (40 points max)
    const categoryMatches = countMatches(book.categories || [], profile.topCategories);
    if (categoryMatches > 0) {
      const categoryScore = categoryMatches === 1 ? 40 : categoryMatches === 2 ? 70 : 90;
      score += categoryScore;
      const matchedCat = (book.categories || []).find((c) => profile.topCategories.includes(c));
      if (matchedCat) {
        matchReasons.push(`You like ${matchedCat}`);
      }
    }

    // Tag matching (30 points max)
    const tagMatches = countMatches(book.tags || [], profile.topTags);
    if (tagMatches > 0) {
      const tagScore = tagMatches === 1 ? 30 : tagMatches === 2 ? 50 : 70;
      score += tagScore;
      if (matchReasons.length < 3) {
        const matchedTag = (book.tags || []).find((t) => profile.topTags.includes(t));
        if (matchedTag) {
          matchReasons.push(`Similar to ${matchedTag}`);
        } else {
          matchReasons.push("Matches your interests");
        }
      }
    }

    // Author matching (50 points max - high value)
    const authorIndex = profile.topAuthors.indexOf(book.author);
    if (authorIndex !== -1) {
      const authorScore = 50 - authorIndex * 5;
      score += authorScore;
      if (matchReasons.length < 3) {
        if (authorIndex === 0) {
          matchReasons.push(`By ${book.author} (your favorite)`);
        } else {
          matchReasons.push(`By ${book.author}`);
        }
      }
    }

    // Publisher matching (20 points)
    if (profile.topPublishers.includes(book.publisher)) {
      score += 20;
    }

    // Format matching (15 points)
    if (profile.topFormats.includes(book.format)) {
      score += 15;
    }

    // Year proximity (25 points max)
    if (book.year && profile.avgPreferredYear) {
      const yearDiff = Math.abs(book.year - profile.avgPreferredYear);
      if (yearDiff <= 15) {
        score += Math.max(25 - yearDiff, 0);
      }
    }

    // Popularity (35 points max, logarithmic)
    if (book.popularityScore && book.popularityScore > 0) {
      score += Math.min(Math.log10(book.popularityScore + 1) * 10, 35);
      if (book.popularityScore > 150 && matchReasons.length < 3) {
        matchReasons.push("Popular with students");
      } else if (book.popularityScore > 100 && matchReasons.length < 3) {
        matchReasons.push("Trending now");
      }
    }

    // Engagement boost based on user's engagement level
    const engagementBoosts = {
      power: 20,
      high: 15,
      medium: 10,
      low: 5,
    };
    score += engagementBoosts[profile.engagementLevel] || 5;

    // Diversity bonus for diverse users
    if (profile.diversityScore > 0.6) {
      const hasNonTopCategory = (book.categories || []).some(
        (cat) => !profile.topCategories.slice(0, 3).includes(cat)
      );
      if (hasNonTopCategory && categoryMatches > 0) {
        score += 15;
      }
    }

    // Recency bonus
    if (profile.recentInteractions > 5) {
      score += Math.min(profile.recentInteractions * 1.5, 20);
    }

    // Penalty for weak matches
    if (categoryMatches === 0 && tagMatches === 0 && authorIndex === -1) {
      score *= 0.4;
    }

    // Ensure match reasons with better messaging
    if (matchReasons.length === 0) {
      if (book.popularityScore > 100) {
        matchReasons.push("Popular with students");
      } else if (book.popularityScore > 50) {
        matchReasons.push("Trending now");
      } else if (book.year && book.year >= 2020) {
        matchReasons.push("Recently published");
      } else {
        matchReasons.push("Recommended for you");
      }
    }

    return {
      ...book,
      _id: book._id.toString(),
      relevanceScore: Math.min(Math.round(score), 100),
      matchReasons: matchReasons.slice(0, 3),
    };
  }).filter((book) => book.relevanceScore > 20);
}

/**
 * Get similar books based on a specific book
 */
async function getSimilarBooks(db, bookId, limit, excludeBookIds) {
  const books = db.collection("books");

  const sourceBook = await books.findOne({ _id: new ObjectId(bookId) });
  if (!sourceBook) {
    return getPopularRecommendations(db, limit);
  }

  const query = {
    _id: { $ne: new ObjectId(bookId), $nin: excludeBookIds.map((id) => new ObjectId(id)) },
    status: "available",
    $or: [],
  };

  if (sourceBook.author) {
    query.$or.push({ author: sourceBook.author });
  }
  if (sourceBook.categories && sourceBook.categories.length > 0) {
    query.$or.push({ categories: { $in: sourceBook.categories } });
  }
  if (sourceBook.tags && sourceBook.tags.length > 0) {
    query.$or.push({ tags: { $in: sourceBook.tags } });
  }
  if (sourceBook.publisher) {
    query.$or.push({ publisher: sourceBook.publisher });
  }

  if (query.$or.length === 0) {
    return getPopularRecommendations(db, limit);
  }

  const candidates = await books.find(query).limit(limit * 3).toArray();

  const scored = candidates.map((book) => {
    let score = 0;
    const matchReasons = [];

    if (book.author === sourceBook.author) {
      score += 70;
      matchReasons.push(`Also by ${book.author}`);
    }

    const categoryMatches = countMatches(book.categories || [], sourceBook.categories || []);
    if (categoryMatches > 0) {
      score += categoryMatches === 1 ? 40 : categoryMatches === 2 ? 70 : 90;
      if (matchReasons.length < 3) {
        const matchedCat = (book.categories || []).find((c) => 
          (sourceBook.categories || []).includes(c)
        );
        if (matchedCat) {
          matchReasons.push(`Similar: ${matchedCat}`);
        } else {
          matchReasons.push("Similar category");
        }
      }
    }

    const tagMatches = countMatches(book.tags || [], sourceBook.tags || []);
    if (tagMatches > 0) {
      score += tagMatches === 1 ? 30 : tagMatches === 2 ? 50 : 70;
      if (matchReasons.length < 3) {
        matchReasons.push("Related topics");
      }
    }

    if (book.publisher === sourceBook.publisher && matchReasons.length < 3) {
      score += 20;
      matchReasons.push(`${book.publisher}`);
    }

    if (book.year && sourceBook.year) {
      const yearDiff = Math.abs(book.year - sourceBook.year);
      if (yearDiff <= 10) {
        score += Math.max(20 - yearDiff, 0);
        if (yearDiff <= 2 && matchReasons.length < 3) {
          matchReasons.push(`Published ${book.year}`);
        }
      }
    }

    if (book.popularityScore) {
      score += Math.min(Math.log10(book.popularityScore + 1) * 8, 25);
      if (book.popularityScore > 100 && matchReasons.length < 3) {
        matchReasons.push("Popular with students");
      }
    }

    if (matchReasons.length === 0) {
      if (book.popularityScore > 50) {
        matchReasons.push("Recommended");
      } else {
        matchReasons.push("You might like this");
      }
    }

    return {
      ...book,
      _id: book._id.toString(),
      relevanceScore: Math.min(Math.round(score), 100),
      matchReasons: matchReasons.slice(0, 3),
    };
  }).filter((book) => book.relevanceScore > 20);

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    recommendations: scored.slice(0, limit),
    profile: {
      basedOn: sourceBook.title,
    },
  };
}

/**
 * Get popular books as fallback
 */
async function getPopularRecommendations(db, limit) {
  const books = db.collection("books");

  const popular = await books
    .find({ status: "available" })
    .sort({ popularityScore: -1, year: -1 })
    .limit(limit)
    .toArray();

  return {
    recommendations: popular.map((book, index) => {
      // Vary the reasons for popular books
      let reason;
      if (index === 0) {
        reason = "Most popular";
      } else if (book.year && book.year >= 2023) {
        reason = "Recently published";
      } else if (book.popularityScore > 150) {
        reason = "Popular with students";
      } else {
        reason = "Trending now";
      }

      return {
        ...book,
        _id: book._id.toString(),
        relevanceScore: 50,
        matchReasons: [reason],
      };
    }),
    profile: {
      totalInteractions: 0,
    },
  };
}

/**
 * Apply diversity filter
 */
function applyDiversityFilter(books, diversityScore) {
  if (books.length <= 5) return books;

  const filtered = [];
  const authorCount = {};
  const categoryCount = {};

  const maxPerAuthor = diversityScore > 0.7 ? 2 : 3;
  const maxPerCategory = diversityScore > 0.7 ? 3 : 4;

  books.sort((a, b) => b.relevanceScore - a.relevanceScore);

  for (const book of books) {
    const author = book.author || "Unknown";
    const primaryCategory = (book.categories && book.categories[0]) || "Uncategorized";

    const authorOk = (authorCount[author] || 0) < maxPerAuthor;
    const categoryOk = (categoryCount[primaryCategory] || 0) < maxPerCategory;

    if ((authorOk && categoryOk) || book.relevanceScore >= 90) {
      filtered.push(book);
      authorCount[author] = (authorCount[author] || 0) + 1;
      categoryCount[primaryCategory] = (categoryCount[primaryCategory] || 0) + 1;
    }
  }

  return filtered;
}

/**
 * Helper: Get top N items by frequency
 */
function getTopItems(arr, n) {
  const frequency = {};
  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
  }
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([item]) => item);
}

/**
 * Helper: Count matches between arrays
 */
function countMatches(arr1, arr2) {
  return arr1.filter((item) => arr2.includes(item)).length;
}

/**
 * Helper: Calculate diversity score
 */
function calculateDiversityScore(categories, tags, authors) {
  const uniqueCategories = new Set(categories).size;
  const uniqueTags = new Set(tags).size;
  const uniqueAuthors = new Set(authors).size;
  const totalItems = categories.length + tags.length + authors.length;

  if (totalItems === 0) return 0.5;

  const diversity = (uniqueCategories + uniqueTags + uniqueAuthors) / totalItems;
  return Math.min(diversity, 1);
}
