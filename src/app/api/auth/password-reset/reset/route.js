import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/passwords";
import crypto from "crypto";

function badRequest(message = "Invalid token or request") {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = (body.token || "").toString();
  const newPassword = (body.password || body.newPassword || "").toString();

  if (!token || !newPassword) return badRequest();

  // Comprehensive password validation
  const passwordError = validatePassword(newPassword);
  if (passwordError) return badRequest(passwordError);

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    const tokens = db.collection("password_reset_tokens");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const now = new Date();
    const tokenDoc = await tokens.findOne({ tokenHash, used: false, expiresAt: { $gt: now } });
    if (!tokenDoc) return badRequest();

    const email = tokenDoc.email;

    const user = await users.findOne({ email }, { projection: { _id: 1 } });
    if (!user) {
      // Mark token as used to avoid reuse even if user missing
      await tokens.updateOne({ _id: tokenDoc._id }, { $set: { used: true, usedAt: now } });
      return badRequest();
    }

    const passwordHash = await hashPassword(newPassword);

    await users.updateOne(
      { email },
      { $set: { passwordHash, updatedAt: now, passwordChangedAt: now } }
    );

    // Invalidate this token and any other active tokens for this email
    await tokens.updateMany({ email, used: false }, { $set: { used: true, usedAt: now } });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Reset password failed:", err);
    return badRequest();
  }
}
