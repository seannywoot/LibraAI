import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { comparePassword } from "@/lib/passwords";

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

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password || "";

        if (!email || !password) {
          throw new Error("Missing credentials");
        }

        // 1) Try database-backed users first
        try {
          const client = await clientPromise;
          const db = client.db();
          const userDoc = await db.collection("users").findOne({ email });
          if (userDoc) {
            const valid = await comparePassword(password, userDoc.passwordHash);
            if (valid) {
              return {
                id: userDoc._id.toString(),
                name: userDoc.name || "User",
                email: userDoc.email,
                role: userDoc.role || "student",
              };
            }
            // If user exists but password invalid, fail immediately
            throw new Error("Invalid credentials");
          }
        } catch (e) {
          // If DB is unreachable, fall back to demo users below
          console.warn("DB authorize fallback:", e?.message || e);
        }

        if (email === STUDENT_DEMO.email && password === STUDENT_DEMO.password) {
          return {
            id: "student-demo",
            name: "Student",
            email,
            role: "student",
          };
        }

        if (email === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
          return {
            id: "admin-demo",
            name: "Admin",
            email,
            role: "admin",
          };
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign-in, copy role and name from user
      if (user) {
        token.role = user.role;
        if (user.name) token.name = user.name;
      }

      // When a client calls useSession().update({ ... }), propagate allowed fields
      if (trigger === "update") {
        if (session?.name) token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.role = token.role;
      if (token.name) session.user.name = token.name;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
