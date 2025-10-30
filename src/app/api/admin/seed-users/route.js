import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/passwords";

const STUDENT = {
  email: "student@demo.edu",
  password: "ReadSmart123",
  name: "Student",
  role: "student",
};

const ADMIN = {
  email: "admin@libra.ai",
  password: "ManageStacks!",
  name: "Admin",
  role: "admin",
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Forbidden in production", { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // Ensure unique index on email
    await users.createIndex({ email: 1 }, { unique: true });

    async function upsertUser(u) {
      const passwordHash = await hashPassword(u.password);
      const now = new Date();
      const res = await users.updateOne(
        { email: u.email },
        {
          $setOnInsert: {
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash,
            createdAt: now,
          },
          $set: { updatedAt: now },
        },
        { upsert: true }
      );
      return res.upsertedId || (await users.findOne({ email: u.email }))?._id;
    }

    const studentId = await upsertUser(STUDENT);
    const adminId = await upsertUser(ADMIN);

    return Response.json({ ok: true, seeded: { studentId, adminId } });
  } catch (err) {
    console.error("Seeding users failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
