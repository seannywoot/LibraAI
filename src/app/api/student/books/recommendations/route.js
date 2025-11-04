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

    const client = await clientPromise;
    const db = client.db();
    const interactions = db.collection("user_interactions");
    const books = db.collection("books");
    const users = db.collection("users");
    const personalLibraries = db.collection("personal_libraries");

    // Get user
    const user = await users.findOne({ email: session.user.email });
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

    // Build query to find candidate books
    const query = {
      $or: [
        { categories: { $in: userProfile.topCategories } },
        { tags: { $in: userProfile.topTags } },
        { author: { $in: userProfile.topAuthors } }
      ],
      status: "available", // Only recommend available books
    };

    // Exclude books in personal library
    if (libraryIsbns.length > 0) {
      query.isbn = { $nin: libraryIsbns };
    }
    if (libraryTitles.length > 0) {
      query.title = { $nin: libraryTitles };
    }

    // Exclude current book if provided
    if (currentBookId) {
      query._id = { $ne: new ObjectId(currentBookId) };
    }

    // Fetch candidate books
    const candidateBooks = await books
      .find(query)
      .limit(limit * 3) // Get more candidates for scoring
      .toArray();

    if (candidateBooks.length === 0) {
      // No matches - return popular books
      return await getPopularBooks(books, limit);
    }

    // Score and rank recommendations
    const recommendations = candidateBooks
      .map(book => ({
        ...book,
        ...calculateRelevance(book, userProfile)
      }))
      .filter(book => book.relevanceScore > 20) // Minimum threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .map(({ _id, title, author, year, format, status, categories, tags, coverImageUrl, relevanceScore, matchReasons }) => ({
        _id: _id.toString(),
        title,
        author,
        year,
        format,
        status,
        categories,
        tags,
        coverImageUrl,
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
          topCategories: userProfile.topCategories.slice(0, 3),
          topTags: userProfile.topTags.slice(0, 3)
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const categories = [];
  const tags = [];
  const authors = [];
  let viewCount = 0;
  let searchCount = 0;

  for (const interaction of interactions) {
    const isRecent = interaction.timestamp >= sevenDaysAgo;
    const weight = isRecent ? 2 : 1; // Recent interactions weighted higher

    if (interaction.eventType === "view") {
      viewCount++;
      
      // Add categories (with weight)
      if (interaction.bookCategories) {
        for (let i = 0; i < weight; i++) {
          categories.push(...interaction.bookCategories);
        }
      }
      
      // Add tags (with weight)
      if (interaction.bookTags) {
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
    } else if (interaction.eventType === "search") {
      searchCount++;
      
      // For search context, weight search queries higher
      if (context === "search" && interaction.searchQuery) {
        // Extract potential categories/tags from search query
        const query = interaction.searchQuery.toLowerCase();
        
        // Simple keyword matching for categories
        if (query.includes("computer") || query.includes("programming")) {
          categories.push("Computer Science", "Programming");
        }
        if (query.includes("math")) {
          categories.push("Mathematics");
        }
        if (query.includes("science")) {
          categories.push("Science");
        }
      }
    }
  }

  // Count frequency and get top items
  const topCategories = getTopItems(categories, 5);
  const topTags = getTopItems(tags, 5);
  const topAuthors = getTopItems(authors, 3);

  return {
    topCategories,
    topTags,
    topAuthors,
    viewCount,
    searchCount,
    recentInteractions: interactions.filter(i => i.timestamp >= sevenDaysAgo).length
  };
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

  // Category matching (30 points per match)
  const categoryMatches = countMatches(
    book.categories || [],
    userProfile.topCategories
  );
  if (categoryMatches > 0) {
    score += categoryMatches * 30;
    matchReasons.push(`Same category: ${book.categories[0]}`);
  }

  // Tag matching (20 points per match)
  const tagMatches = countMatches(
    book.tags || [],
    userProfile.topTags
  );
  if (tagMatches > 0) {
    score += tagMatches * 20;
    if (matchReasons.length < 2) {
      matchReasons.push("Similar topics");
    }
  }

  // Author matching (15 points)
  if (userProfile.topAuthors.includes(book.author)) {
    score += 15;
    if (matchReasons.length < 2) {
      matchReasons.push("Author you've viewed");
    }
  }

  // Recency boost (up to 10 points)
  if (userProfile.recentInteractions > 0) {
    score += Math.min(userProfile.recentInteractions * 2, 10);
  }

  // Popularity score (up to 25 points)
  if (book.popularityScore) {
    score += Math.min(book.popularityScore * 0.25, 25);
  }

  // Boost for recent publications
  if (book.year && book.year >= 2020) {
    score += 5;
    if (matchReasons.length < 2 && !matchReasons.some(r => r.includes("category") || r.includes("topics"))) {
      matchReasons.push("Recent publication");
    }
  }

  // Popular books boost
  if (book.popularityScore > 50 && matchReasons.length < 2) {
    matchReasons.push("Popular with students");
  }

  return {
    relevanceScore: Math.min(Math.round(score), 100),
    matchReasons: matchReasons.slice(0, 2)
  };
}

/**
 * Count matching items between two arrays
 */
function countMatches(arr1, arr2) {
  return arr1.filter(item => arr2.includes(item)).length;
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
