import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

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
      ...user,
      emailNotifications: user.emailNotifications ?? true
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = (body?.name ?? "").toString();
    const name = rawName.trim();
    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Name is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const now = new Date();
    const updateFields = { name, updatedAt: now };
    
    // Include emailNotifications if provided
    if (typeof body.emailNotifications === 'boolean') {
      updateFields.emailNotifications = body.emailNotifications;
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
        name,
        emailNotifications: updateFields.emailNotifications 
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
