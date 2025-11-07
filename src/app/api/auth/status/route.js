import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

// Use this endpoint for lightweight auth checks without overriding NextAuth's
// built-in /api/auth/session route. Includes theme preference for convenience.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        theme: session.user.theme ?? null,
      },
    },
    { status: 200 }
  );
}