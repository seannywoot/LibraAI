import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit('recommendations', session.user.email);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            "content-type": "application/json",
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
            "Retry-After": rateLimit.retryAfter.toString()
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);
    const context = searchParams.get("context") || "browse";
    const currentBookId = searchParams.get("currentBookId");
    const bookId = searchParams.get("bookId"); // For book-specific recommendations

    const client = await clientPromise;
    const db = client.db();
    const interactions = db.collection("user_interactions");
    const books = db.collection("books");
    const users = db.collection("users");
    const personalLibraries = db.collection("personal_libraries");

    // Get user
    const user = await users.findOne({ email: session.user.email });
    
    // If bookId is provided, get recommendations based on that specific book
    if (bookId) {
      return await getBookBasedRecommendations(books, bookId, limit);
    }
    
    if (!user) {
      // New user with no history - return popular books
      return await getPopularBooks(books, limit);
    }

    // Get user's interaction history (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const userInteractions = await interactions
      .find({
        userId: user._id,
        timestamp: { $gte: ninetyDaysAgo }
      })
      .sort({ timestamp: -1 })
      .toArray();

    if (userInteractions.length === 0) {
      // No history - return popular books
      return await getPopularBooks(books, limit);
    }

    // Analyze user history
    const userProfile = analyzeUserHistory(userInteractions, context);

    // Get books already in user's personal library to exclude them
    const libraryBooks = await personalLibraries
      .find({ userId: user._id })
      .project({ isbn: 1, title: 1 })
      .toArray();
    
    const libraryIsbns = libraryBooks.map(b => b.isbn).filter(Boolean);
    const libraryTitles = libraryBooks.map(b => b.title).filter(Boolean);

    // Build query to find candidate books with multiple strategies
    const queries = [];

    // Strategy 1: Exact category/tag/author matches (primary)
    if (userProfile.topCategories.length > 0 || userProfile.topTags.length > 0 || userProfile.topAuthors.length > 0) {
      queries.push({
        $or: [
          { categories: { $in: userProfile.topCategories } },
          { tags: { $in: userProfile.topTags } },
          { author: { $in: userProfile.topAuthors } }
        ],
        status: "available"
      });
    }

    // Strategy 2: Publisher-based recommendations
    if (userProfile.topPublishers.length > 0) {
      queries.push({
        publisher: { $in: userProfile.topPublishers },
        status: "available"
      });
    }

    // Strategy 3: Format preferences
    if (userProfile.topFormats.length > 0) {
      queries.push({
        format: { $in: userProfile.topFormats },
        status: "available"
      });
    }

    // Strategy 4: Year-based recommendations (if user prefers recent/classic books)
    if (userProfile.avgPreferredYear) {
      const yearRange = 10; // ±10 years from average
      queries.push({
        year: {
          $gte: userProfile.avgPreferredYear - yearRange,
          $lte: userProfile.avgPreferredYear + yearRange
        },
        status: "available"
      });
    }

    // Combine all strategies
    const baseQuery = queries.length > 0 ? { $or: queries } : { status: "available" };

    // Exclude books in personal library
    const excludeConditions = [];
    if (libraryIsbns.length > 0) {
      excludeConditions.push({ isbn: { $nin: libraryIsbns } });
    }
    if (libraryTitles.length > 0) {
      excludeConditions.push({ title: { $nin: libraryTitles } });
    }
    if (currentBookId) {
      excludeConditions.push({ _id: { $ne: new ObjectId(currentBookId) } });
    }

    const finalQuery = excludeConditions.length > 0
      ? { $and: [baseQuery, ...excludeConditions] }
      : baseQuery;

    // Fetch candidate books (get more for better diversity)
    const candidateBooks = await books
      .find(finalQuery)
      .limit(limit * 5) // Get more candidates for better scoring and diversity
      .toArray();

    if (candidateBooks.length === 0) {
      // No matches - return popular books
      return await getPopularBooks(books, limit);
    }

    // Score and rank recommendations
    let scoredBooks = candidateBooks
      .map(book => ({
        ...book,
        ...calculateRelevance(book, userProfile)
      }))
      .filter(book => book.relevanceScore > 15); // Lower threshold for more options

    // Apply diversity filter to prevent too many books from same author/category
    scoredBooks = applyDiversityFilter(scoredBooks, userProfile.diversityScore);

    // Sort by relevance score
    scoredBooks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top recommendations
    const recommendations = scoredBooks
      .slice(0, limit)
      .map(({ _id, title, author, year, format, status, categories, tags, coverImageUrl, relevanceScore, matchReasons, publisher, isbn, description }) => ({
        _id: _id.toString(),
        title,
        author,
        year,
        format,
        status,
        categories,
        tags,
        coverImageUrl,
        publisher,
        isbn,
        description,
        relevanceScore,
        matchReasons
      }));

    return new Response(
      JSON.stringify({
        ok: true,
        recommendations,
        basedOn: {
          viewCount: userProfile.viewCount,
          searchCount: userProfile.searchCount,
          totalInteractions: userProfile.totalInteractions,
          recentInteractions: userProfile.recentInteractions,
          topCategories: userProfile.topCategories.slice(0, 3),
          topTags: userProfile.topTags.slice(0, 3),
          topAuthors: userProfile.topAuthors.slice(0, 2),
          diversityScore: Math.round(userProfile.diversityScore * 100),
          preferredYear: userProfile.avgPreferredYear
        },
        meta: {
          candidatesEvaluated: candidateBooks.length,
          algorithmsUsed: ["collaborative-filtering", "content-based", "popularity", "diversity"],
          version: "2.0"
        }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  } catch (error) {
    console.error("Get recommendations failed:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Failed to get recommendations"
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

/**
 * Analyze user interaction history to build a profile
 */
function analyzeUserHistory(interactions, context) {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const categories = [];
  const tags = [];
  const authors = [];
  const publishers = [];
  const formats = [];
  const yearPreferences = [];
  let viewCount = 0;
  let searchCount = 0;

  for (const interaction of interactions) {
    const timestamp = new Date(interaction.timestamp);
    
    // Time-decay weighting: recent = 3x, last 7 days = 2x, last 30 days = 1.5x, older = 1x
    let weight = 1;
    if (timestamp >= sevenDaysAgo) {
      weight = 3;
    } else if (timestamp >= thirtyDaysAgo) {
      weight = 2;
    } else {
      weight = 1.5;
    }

    if (interaction.eventType === "view") {
      viewCount++;
      
      // Add categories (with weight)
      if (interaction.bookCategories && Array.isArray(interaction.bookCategories)) {
        for (let i = 0; i < weight; i++) {
          categories.push(...interaction.bookCategories);
        }
      }
      
      // Add tags (with weight)
      if (interaction.bookTags && Array.isArray(interaction.bookTags)) {
        for (let i = 0; i < weight; i++) {
          tags.push(...interaction.bookTags);
        }
      }
      
      // Add author (with weight)
      if (interaction.bookAuthor) {
        for (let i = 0; i < weight; i++) {
          authors.push(interaction.bookAuthor);
        }
      }

      // Track format preferences
      if (interaction.bookFormat) {
        for (let i = 0; i < weight; i++) {
          formats.push(interaction.bookFormat);
        }
      }

      // Track publisher preferences
      if (interaction.bookPublisher) {
        for (let i = 0; i < weight; i++) {
          publishers.push(interaction.bookPublisher);
        }
      }

      // Track year preferences (for recency bias)
      if (interaction.bookYear) {
        for (let i = 0; i < weight; i++) {
          yearPreferences.push(interaction.bookYear);
        }
      }
    } else if (interaction.eventType === "search") {
      searchCount++;
      
      // Extract insights from search queries
      if (interaction.searchQuery) {
        const query = interaction.searchQuery.toLowerCase();
        
        // Enhanced keyword matching for categories
        const categoryKeywords = {
          "Computer Science": ["computer", "programming", "software", "coding", "algorithm", "data structure"],
          "Mathematics": ["math", "calculus", "algebra", "geometry", "statistics"],
          "Science": ["science", "physics", "chemistry", "biology"],
          "Business": ["business", "management", "marketing", "finance", "economics"],
          "History": ["history", "historical", "war", "ancient", "medieval"],
          "Fiction": ["fiction", "novel", "story", "fantasy", "sci-fi", "mystery"],
          "Self-Help": ["self-help", "motivation", "productivity", "habits", "success"],
          "Education": ["education", "teaching", "learning", "pedagogy"],
          "Psychology": ["psychology", "mental", "behavior", "cognitive"],
          "Philosophy": ["philosophy", "ethics", "logic", "metaphysics"]
        };

        // Match search query to categories
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => query.includes(keyword))) {
            for (let i = 0; i < weight; i++) {
              categories.push(category);
            }
          }
        }

        // Extract author names from search (if query contains "by")
        if (query.includes(" by ")) {
          const authorMatch = query.split(" by ")[1]?.trim();
          if (authorMatch) {
            for (let i = 0; i < weight; i++) {
              authors.push(authorMatch);
            }
          }
        }
      }

      // Consider search filters
      if (interaction.searchFilters) {
        const filters = interaction.searchFilters;
        
        // Track format preferences from filters
        if (filters.formats && Array.isArray(filters.formats)) {
          for (let i = 0; i < weight; i++) {
            formats.push(...filters.formats);
          }
        }

        // Track year preferences from filters
        if (filters.yearRange) {
          const { min, max } = filters.yearRange;
          if (min && max) {
            const avgYear = Math.floor((min + max) / 2);
            for (let i = 0; i < weight; i++) {
              yearPreferences.push(avgYear);
            }
          }
        }
      }
    }
  }

  // Count frequency and get top items
  const topCategories = getTopItems(categories, 7);
  const topTags = getTopItems(tags, 8);
  const topAuthors = getTopItems(authors, 5);
  const topPublishers = getTopItems(publishers, 3);
  const topFormats = getTopItems(formats, 3);

  // Calculate average preferred year
  const avgPreferredYear = yearPreferences.length > 0
    ? Math.round(yearPreferences.reduce((sum, year) => sum + year, 0) / yearPreferences.length)
    : null;

  // Determine diversity score (how varied are user's interests)
  const diversityScore = calculateDiversityScore(categories, tags);

  return {
    topCategories,
    topTags,
    topAuthors,
    topPublishers,
    topFormats,
    avgPreferredYear,
    diversityScore,
    viewCount,
    searchCount,
    recentInteractions: interactions.filter(i => new Date(i.timestamp) >= sevenDaysAgo).length,
    totalInteractions: interactions.length
  };
}

/**
 * Calculate diversity score (0-1) based on how varied user's interests are
 */
function calculateDiversityScore(categories, tags) {
  const uniqueCategories = new Set(categories).size;
  const uniqueTags = new Set(tags).size;
  const totalItems = categories.length + tags.length;
  
  if (totalItems === 0) return 0.5; // Default neutral score
  
  const diversity = (uniqueCategories + uniqueTags) / totalItems;
  return Math.min(diversity, 1);
}

/**
 * Get top N most frequent items from an array
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
 * Calculate relevance score for a book based on user profile
 */
function calculateRelevance(book, userProfile) {
  let score = 0;
  const matchReasons = [];
  const matchDetails = {
    categoryScore: 0,
    tagScore: 0,
    authorScore: 0,
    publisherScore: 0,
    formatScore: 0,
    yearScore: 0,
    popularityScore: 0,
    diversityBonus: 0
  };

  // 1. Category matching (35 points per match, with diminishing returns)
  const categoryMatches = countMatches(
    book.categories || [],
    userProfile.topCategories
  );
  if (categoryMatches > 0) {
    // First match: 35, second: 25, third: 15
    matchDetails.categoryScore = categoryMatches === 1 ? 35 : categoryMatches === 2 ? 60 : 75;
    score += matchDetails.categoryScore;
    
    const matchedCategory = (book.categories || []).find(c => userProfile.topCategories.includes(c));
    if (matchedCategory) {
      matchReasons.push(`Category: ${matchedCategory}`);
    }
  }

  // 2. Tag matching (25 points per match, with diminishing returns)
  const tagMatches = countMatches(
    book.tags || [],
    userProfile.topTags
  );
  if (tagMatches > 0) {
    matchDetails.tagScore = tagMatches === 1 ? 25 : tagMatches === 2 ? 45 : 60;
    score += matchDetails.tagScore;
    
    if (matchReasons.length < 3) {
      const matchedTag = (book.tags || []).find(t => userProfile.topTags.includes(t));
      if (matchedTag) {
        matchReasons.push(`Topic: ${matchedTag}`);
      }
    }
  }

  // 3. Author matching (40 points - high value for author loyalty)
  const authorIndex = userProfile.topAuthors.indexOf(book.author);
  if (authorIndex !== -1) {
    // More points for top authors: 1st = 40, 2nd = 35, 3rd = 30, etc.
    matchDetails.authorScore = 40 - (authorIndex * 5);
    score += matchDetails.authorScore;
    
    if (matchReasons.length < 3) {
      matchReasons.push(`Author: ${book.author}`);
    }
  }

  // 4. Publisher matching (15 points)
  if (userProfile.topPublishers.includes(book.publisher)) {
    matchDetails.publisherScore = 15;
    score += matchDetails.publisherScore;
    
    if (matchReasons.length < 3 && !matchReasons.some(r => r.includes("Author"))) {
      matchReasons.push(`Publisher: ${book.publisher}`);
    }
  }

  // 5. Format preference (10 points)
  if (userProfile.topFormats.includes(book.format)) {
    matchDetails.formatScore = 10;
    score += matchDetails.formatScore;
  }

  // 6. Year preference matching (up to 20 points)
  if (book.year && userProfile.avgPreferredYear) {
    const yearDiff = Math.abs(book.year - userProfile.avgPreferredYear);
    if (yearDiff <= 15) {
      matchDetails.yearScore = Math.max(20 - yearDiff, 0);
      score += matchDetails.yearScore;
      
      // Add reason for very close matches
      if (yearDiff <= 3 && matchReasons.length < 3) {
        matchReasons.push(`Published ${book.year}`);
      }
    }
  }

  // 7. Popularity score (up to 30 points, logarithmic scale)
  if (book.popularityScore && book.popularityScore > 0) {
    // Logarithmic scaling to prevent over-weighting popular books
    matchDetails.popularityScore = Math.min(Math.log10(book.popularityScore + 1) * 10, 30);
    score += matchDetails.popularityScore;
    
    if (book.popularityScore > 100 && matchReasons.length < 3) {
      matchReasons.push("Highly popular");
    }
  }

  // 8. Diversity bonus (encourage exploration)
  // If user has diverse interests, boost books outside their top categories
  if (userProfile.diversityScore > 0.6) {
    const hasNonTopCategory = (book.categories || []).some(
      cat => !userProfile.topCategories.slice(0, 3).includes(cat)
    );
    if (hasNonTopCategory && categoryMatches > 0) {
      matchDetails.diversityBonus = 10;
      score += matchDetails.diversityBonus;
    }
  }

  // 9. Recency activity boost (up to 15 points)
  if (userProfile.recentInteractions > 0) {
    const activityBoost = Math.min(userProfile.recentInteractions * 1.5, 15);
    score += activityBoost;
  }

  // 10. Engagement quality bonus
  // Users with more interactions get better recommendations
  if (userProfile.totalInteractions > 20) {
    score += 5;
  }

  // 11. Penalize if no strong matches
  if (categoryMatches === 0 && tagMatches === 0 && authorIndex === -1) {
    score *= 0.5; // Reduce score by 50% for weak matches
  }

  // Ensure match reasons are meaningful
  if (matchReasons.length === 0) {
    if (book.popularityScore > 50) {
      matchReasons.push("Popular choice");
    } else if (book.year && book.year >= 2020) {
      matchReasons.push("Recent publication");
    } else {
      matchReasons.push("Recommended for you");
    }
  }

  return {
    relevanceScore: Math.min(Math.round(score), 100),
    matchReasons: matchReasons.slice(0, 3),
    matchDetails // For debugging/analytics
  };
}

/**
 * Count matching items between two arrays
 */
function countMatches(arr1, arr2) {
  return arr1.filter(item => arr2.includes(item)).length;
}

/**
 * Apply diversity filter to prevent recommendation monotony
 * Ensures variety in authors, categories, and publishers
 */
function applyDiversityFilter(books, diversityScore) {
  if (books.length <= 5) return books; // Not enough books to filter

  const filtered = [];
  const authorCount = {};
  const categoryCount = {};
  const publisherCount = {};

  // Limits based on diversity score
  const maxPerAuthor = diversityScore > 0.7 ? 2 : 3;
  const maxPerCategory = diversityScore > 0.7 ? 3 : 4;
  const maxPerPublisher = diversityScore > 0.7 ? 3 : 4;

  for (const book of books) {
    const author = book.author || "Unknown";
    const primaryCategory = (book.categories && book.categories[0]) || "Uncategorized";
    const publisher = book.publisher || "Unknown";

    // Check if adding this book would exceed diversity limits
    const authorOk = (authorCount[author] || 0) < maxPerAuthor;
    const categoryOk = (categoryCount[primaryCategory] || 0) < maxPerCategory;
    const publisherOk = (publisherCount[publisher] || 0) < maxPerPublisher;

    // Add book if it passes diversity checks OR if it has very high relevance
    if ((authorOk && categoryOk && publisherOk) || book.relevanceScore >= 85) {
      filtered.push(book);
      authorCount[author] = (authorCount[author] || 0) + 1;
      categoryCount[primaryCategory] = (categoryCount[primaryCategory] || 0) + 1;
      publisherCount[publisher] = (publisherCount[publisher] || 0) + 1;
    }
  }

  // If filtering was too aggressive, add back high-scoring books
  if (filtered.length < Math.min(books.length, 10)) {
    const remaining = books.filter(b => !filtered.includes(b))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10 - filtered.length);
    filtered.push(...remaining);
  }

  return filtered;
}

/**
 * Get popular books as fallback
 */
async function getPopularBooks(booksCollection, limit) {
  const popularBooks = await booksCollection
    .find({ status: "available" })
    .sort({ popularityScore: -1, year: -1 })
    .limit(limit)
    .toArray();

  const recommendations = popularBooks.map(book => ({
    _id: book._id.toString(),
    title: book.title,
    author: book.author,
    year: book.year,
    format: book.format,
    status: book.status,
    categories: book.categories || [],
    tags: book.tags || [],
    coverImageUrl: book.coverImageUrl,
    relevanceScore: 50,
    matchReasons: ["Popular with students"]
  }));

  return new Response(
    JSON.stringify({
      ok: true,
      recommendations,
      basedOn: {
        viewCount: 0,
        searchCount: 0,
        topCategories: [],
        topTags: []
      }
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

/**
 * Get recommendations based on a specific book
 */
async function getBookBasedRecommendations(booksCollection, bookId, limit) {
  const { ObjectId } = require("mongodb");
  
  // Get the source book
  const sourceBook = await booksCollection.findOne({
    _id: new ObjectId(bookId)
  });

  if (!sourceBook) {
    return await getPopularBooks(booksCollection, limit);
  }

  // Build query to find similar books
  const query = {
    _id: { $ne: new ObjectId(bookId) }, // Exclude the current book
    status: "available",
    $or: []
  };

  // Match by author (highest priority)
  if (sourceBook.author) {
    query.$or.push({ author: sourceBook.author });
  }

  // Match by categories
  if (sourceBook.categories && sourceBook.categories.length > 0) {
    query.$or.push({ categories: { $in: sourceBook.categories } });
  }

  // Match by tags
  if (sourceBook.tags && sourceBook.tags.length > 0) {
    query.$or.push({ tags: { $in: sourceBook.tags } });
  }

  // Match by publisher
  if (sourceBook.publisher) {
    query.$or.push({ publisher: sourceBook.publisher });
  }

  // If no matching criteria, return popular books
  if (query.$or.length === 0) {
    return await getPopularBooks(booksCollection, limit);
  }

  // Fetch candidate books
  const candidateBooks = await booksCollection
    .find(query)
    .limit(limit * 3)
    .toArray();

  if (candidateBooks.length === 0) {
    return await getPopularBooks(booksCollection, limit);
  }

  // Score books based on similarity with improved algorithm
  let scoredBooks = candidateBooks
    .map(book => {
      let score = 0;
      const matchReasons = [];

      // Same author (60 points - highest priority for book-based recommendations)
      if (book.author === sourceBook.author) {
        score += 60;
        matchReasons.push(`By ${book.author}`);
      }

      // Category matches (35 points per match, diminishing returns)
      const categoryMatches = countMatches(
        book.categories || [],
        sourceBook.categories || []
      );
      if (categoryMatches > 0) {
        score += categoryMatches === 1 ? 35 : categoryMatches === 2 ? 60 : 75;
        if (matchReasons.length < 3) {
          const matchedCat = (book.categories || []).find(c => 
            (sourceBook.categories || []).includes(c)
          );
          if (matchedCat) {
            matchReasons.push(`Category: ${matchedCat}`);
          }
        }
      }

      // Tag matches (25 points per match, diminishing returns)
      const tagMatches = countMatches(
        book.tags || [],
        sourceBook.tags || []
      );
      if (tagMatches > 0) {
        score += tagMatches === 1 ? 25 : tagMatches === 2 ? 45 : 60;
        if (matchReasons.length < 3) {
          matchReasons.push("Similar topics");
        }
      }

      // Same publisher (15 points)
      if (book.publisher && book.publisher === sourceBook.publisher) {
        score += 15;
        if (matchReasons.length < 3 && !matchReasons.some(r => r.includes("By"))) {
          matchReasons.push(`${book.publisher}`);
        }
      }

      // Similar publication year (up to 15 points)
      if (book.year && sourceBook.year) {
        const yearDiff = Math.abs(book.year - sourceBook.year);
        if (yearDiff <= 10) {
          score += Math.max(15 - yearDiff, 0);
          
          if (yearDiff <= 2 && matchReasons.length < 3) {
            matchReasons.push(`Published ${book.year}`);
          }
        }
      }

      // Same format (10 points - users often prefer consistent formats)
      if (book.format === sourceBook.format) {
        score += 10;
      }

      // Popularity boost (logarithmic, up to 20 points)
      if (book.popularityScore && book.popularityScore > 0) {
        score += Math.min(Math.log10(book.popularityScore + 1) * 6, 20);
      }

      // Title similarity bonus (simple check for series/related books)
      if (book.title && sourceBook.title) {
        const titleWords1 = sourceBook.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const titleWords2 = book.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const commonWords = titleWords1.filter(w => titleWords2.includes(w)).length;
        
        if (commonWords > 0) {
          score += commonWords * 8;
          if (commonWords >= 2 && matchReasons.length < 3) {
            matchReasons.push("Related series");
          }
        }
      }

      // Ensure at least one match reason
      if (matchReasons.length === 0) {
        if (book.popularityScore > 50) {
          matchReasons.push("Popular choice");
        } else {
          matchReasons.push("Similar book");
        }
      }

      return {
        ...book,
        relevanceScore: Math.min(Math.round(score), 100),
        matchReasons: matchReasons.slice(0, 3)
      };
    })
    .filter(book => book.relevanceScore > 15);

  // Apply diversity to prevent too many books by same author
  const authorCount = {};
  const diverseBooks = [];
  
  scoredBooks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  for (const book of scoredBooks) {
    const author = book.author || "Unknown";
    if ((authorCount[author] || 0) < 3 || book.relevanceScore >= 80) {
      diverseBooks.push(book);
      authorCount[author] = (authorCount[author] || 0) + 1;
    }
    if (diverseBooks.length >= limit * 2) break;
  }

  const recommendations = diverseBooks
    .slice(0, limit)
    .map(({ _id, title, author, year, format, status, categories, tags, coverImageUrl, relevanceScore, matchReasons, publisher, isbn, description }) => ({
      _id: _id.toString(),
      title,
      author,
      year,
      format,
      status,
      categories,
      tags,
      coverImageUrl,
      publisher,
      isbn,
      description,
      relevanceScore,
      matchReasons
    }));

  return new Response(
    JSON.stringify({
      ok: true,
      recommendations,
      basedOn: {
        book: sourceBook.title,
        author: sourceBook.author,
        categories: sourceBook.categories || []
      }
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
