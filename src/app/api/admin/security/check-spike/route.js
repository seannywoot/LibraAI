import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkFailedLoginSpike } from "@/lib/security-notifications";

/**
 * Manually trigger failed login spike check
 * GET /api/admin/security/check-spike
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkFailedLoginSpike();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error checking failed login spike:", error);
    return NextResponse.json(
      { error: "Failed to check spike" },
      { status: 500 }
    );
  }
}
