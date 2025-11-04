import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getLockedAccounts,
  unlockAccount,
  getAttemptCount,
} from "@/lib/brute-force-protection";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lockedAccounts = getLockedAccounts();

    return NextResponse.json({
      success: true,
      lockedAccounts,
      count: lockedAccounts.length,
    });
  } catch (error) {
    console.error("Error fetching locked accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch locked accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, identifier } = body;

    if (action === "unlock") {
      if (!identifier) {
        return NextResponse.json(
          { error: "Identifier required" },
          { status: 400 }
        );
      }

      const result = unlockAccount(identifier);
      return NextResponse.json({
        success: true,
        message: `Account ${identifier} has been unlocked`,
        result,
      });
    }

    if (action === "check") {
      if (!identifier) {
        return NextResponse.json(
          { error: "Identifier required" },
          { status: 400 }
        );
      }

      const attemptInfo = getAttemptCount(identifier);
      return NextResponse.json({
        success: true,
        identifier,
        ...attemptInfo,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'unlock' or 'check'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing locked accounts:", error);
    return NextResponse.json(
      { error: "Failed to manage locked accounts" },
      { status: 500 }
    );
  }
}
