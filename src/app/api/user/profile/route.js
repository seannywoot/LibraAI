import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

function normalizeAllowedOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch (_) {
    return null;
  }
}

function isRequestFromAllowedOrigin(request) {
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const hostHeader = request.headers.get("host");

  const allowedOrigins = new Set();
  const appendOrigin = (value) => {
    const normalized = normalizeAllowedOrigin(value);
    if (normalized) allowedOrigins.add(normalized);
  };

  appendOrigin(request.url);
  appendOrigin(process.env.NEXTAUTH_URL);
  appendOrigin(process.env.NEXT_PUBLIC_BASE_URL);
  appendOrigin(process.env.NEXT_PUBLIC_APP_URL);
  appendOrigin(process.env.APP_BASE_URL);
  if (process.env.VERCEL_URL) {
    appendOrigin(`https://${process.env.VERCEL_URL}`);
    appendOrigin(`http://${process.env.VERCEL_URL}`);
  }

  if (hostHeader) {
    appendOrigin(`https://${hostHeader}`);
    appendOrigin(`http://${hostHeader}`);
  }

  const matchesAllowedOrigin = (value) => {
    if (!value) return false;
    try {
      const headerOrigin = new URL(value).origin;
      return allowedOrigins.has(headerOrigin);
    } catch (_) {
      return false;
    }
  };

  return matchesAllowedOrigin(originHeader) || matchesAllowedOrigin(refererHeader);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // Exclude sensitive fields like passwordHash from the result
    const user = await users.findOne(
      { email: session.user.email },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: "User not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Include emailNotifications preference (default to true if not set)
    const userWithPrefs = {
      name: user.name,
      email: user.email,
      role: user.role,
      emailNotifications: user.emailNotifications ?? true,
      theme: user.theme === "dark" ? "dark" : user.theme === "light" ? "light" : null,
    };

    return new Response(
      JSON.stringify({ ok: true, user: userWithPrefs }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get profile failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

export async function PUT(request) {
  try {
    if (!isRequestFromAllowedOrigin(request)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid request origin" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    
    const theme = (body?.theme ?? "").toString().toLowerCase();
    const themeValue = theme === "dark" ? "dark" : theme === "light" ? "light" : undefined;

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const now = new Date();
    const updateFields = { updatedAt: now };

    // Include name if provided
    if (body?.name !== undefined) {
      const rawName = (body.name ?? "").toString();
      const name = rawName.trim();
      if (!name) {
        return new Response(
          JSON.stringify({ ok: false, error: "Name cannot be empty" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
      updateFields.name = name;
    }

    // Include emailNotifications if provided
    if (typeof body.emailNotifications === "boolean") {
      updateFields.emailNotifications = body.emailNotifications;
    }

    if (themeValue) {
      updateFields.theme = themeValue;
    }

    const result = await users.updateOne(
      { email: session.user.email },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      // Likely a demo account without a backing DB user
      return new Response(
        JSON.stringify({ ok: false, error: "User not found for update" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        name: updateFields.name,
        emailNotifications: updateFields.emailNotifications,
        theme: themeValue,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Update profile failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
