import { NextResponse } from "next/server";

const SESSION_COOKIE = "libraai-session";

export async function GET(request) {
  const role = request.cookies.get(SESSION_COOKIE)?.value;

  if (!role) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, role }, { status: 200 });
}