import clientPromise from "@/lib/mongodb";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function appBaseUrl() {
  return process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
}

export async function POST(request) {
  const now = new Date();
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  // Always return 200 to avoid account enumeration
  const genericOk = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  if (!email) return genericOk;

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    const tokens = db.collection("password_reset_tokens");

    // Ensure helpful indexes (created once, reused subsequently)
    await tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await tokens.createIndex({ tokenHash: 1 });
    await tokens.createIndex({ email: 1, used: 1 });

    const user = await users.findOne({ email }, { projection: { _id: 1, email: 1 } });

    // Whether or not user exists, we "succeed". If no user, skip creating token/email.
    if (!user) return genericOk;

    // Optionally, clear any previous unused tokens for this email to keep 1 active
    await tokens.deleteMany({ email, used: false });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresMinutes = Number(process.env.PASSWORD_RESET_EXP_MIN || 15);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await tokens.insertOne({
      email,
      tokenHash,
      used: false,
      createdAt: now,
      expiresAt,
    });

    const base = appBaseUrl().replace(/\/$/, "");
    const resetUrl = `${base}/auth/reset?token=${token}`;

    // Send email via our SMTP/nodemailer helper. Swallow any error to preserve enumeration resistance.
    try {
      await sendPasswordResetEmail(email, resetUrl, { expiresMinutes });
    } catch (mailErr) {
      console.warn("Password reset email send failed:", mailErr?.message || mailErr);
    }

    return genericOk;
  } catch (err) {
    // Do not leak error details
    console.error("Request password reset failed:", err);
    return genericOk;
  }
}
