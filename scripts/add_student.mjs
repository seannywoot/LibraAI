// One-off script to add a specific student user to MongoDB
// Email: 202310230@gordoncollege.edu.ph
// Password: LibraAI2025

import { MongoClient, ServerApiVersion } from "mongodb";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

// Try to load MONGODB_URI from .env.local if not present
function loadEnvLocal() {
  const root = path.resolve(process.cwd(), ".");
  const envPath = path.join(root, ".env.local");
  if (!process.env.MONGODB_URI && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      // Remove surrounding quotes if any
      value = value.replace(/^['"](.*)['"]$/, "$1");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;

if (!uri) {
  console.error("Missing MONGODB_URI. Set it in your environment or .env.local");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    // Ensure unique index on email
    await users.createIndex({ email: 1 }, { unique: true });

    const email = "202310230@gordoncollege.edu.ph";
    const role = "student";
    const name = email.split("@")[0];
    const password = "LibraAI2025";

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date();

    const res = await users.updateOne(
      { email },
      {
        $setOnInsert: {
          email,
          name,
          role,
          passwordHash,
          createdAt: now,
        },
        $set: { updatedAt: now, passwordChangedAt: now },
      },
      { upsert: true }
    );

    if (res.upsertedId) {
      console.log(`Created student user ${email} with default password.`);
    } else {
      console.log(`User ${email} already existed. Updated password and metadata.`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed to add student:", err?.message || err);
  process.exit(1);
});
