import { NextResponse } from "next/server";

const SESSION_COOKIE = "libraai-session";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

const STUDENT_DEMO = {
  email: "student@demo.edu",
  password: "ReadSmart123",
};

const ADMIN_DEMO = {
  email: "admin@libra.ai",
  password: "ManageStacks!",
};

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function buildSuccessResponse(role) {
  const response = NextResponse.json({ role });
  response.cookies.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const normalized = normalizeEmail(email);

    if (normalized === STUDENT_DEMO.email && password === STUDENT_DEMO.password) {
      return buildSuccessResponse("student");
    }

    if (normalized === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
      return buildSuccessResponse("admin");
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}