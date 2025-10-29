import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ 
    authenticated: true, 
    user: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    }
  }, { status: 200 });
}