import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getRecommendations } from "@/lib/recommendation-engine";

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

    // Build exclude list
    const excludeBookIds = currentBookId ? [currentBookId] : [];

    // Get recommendations using new engine
    const result = await getRecommendations({
      userId: session.user.email,
      limit,
      excludeBookIds,
      context,
      bookId,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        recommendations: result.recommendations,
        basedOn: result.profile,
        meta: {
          algorithmsUsed: ["collaborative-filtering", "content-based", "popularity", "diversity", "engagement-based"],
          version: "3.0"
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
