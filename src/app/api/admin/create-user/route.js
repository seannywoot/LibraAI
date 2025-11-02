import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/passwords";
import crypto from "crypto";

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function generatePassword(length = 14) {
  // URL-safe base64, then slice and replace to ensure a mix
  const raw = crypto.randomBytes(24).toString("base64");
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
  const base = cleaned.slice(0, Math.max(length - 3, 8));
  // Ensure complexity by injecting at least one of each class
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%^&*";
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const composed = base + pick(upper) + pick(digits) + pick(specials);
  return composed.slice(0, length);
}

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Forbidden in production", { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const role = (body.role || "student").toString();
    const name = (body.name || email?.split("@")[0] || "User").toString();

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Email is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true });

    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const existing = await users.findOne({ email });

    if (existing) {
      await users.updateOne(
        { _id: existing._id },
        {
          $set: { name, role, passwordHash, updatedAt: now, passwordChangedAt: now },
        }
      );
      return new Response(
        JSON.stringify({ ok: true, created: false, email, role, password, userId: existing._id }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    const res = await users.insertOne({
      email,
      name,
      role,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(
      JSON.stringify({ ok: true, created: true, email, role, password, userId: res.insertedId }),
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Create user failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
