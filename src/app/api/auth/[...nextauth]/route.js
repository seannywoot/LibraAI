import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { comparePassword } from "@/lib/passwords";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/brute-force-protection";

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
        // Optional: the portal the user is attempting to access ("student" | "admin")
        expectedRole: { label: "Expected Role", type: "text" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password || "";
        const expectedRole = (credentials?.expectedRole || "").trim().toLowerCase();

        if (!email || !password) {
          throw new Error("Missing credentials");
        }

        // Check if account is locked due to too many failed attempts
        const lockStatus = isAccountLocked(email);
        if (lockStatus.locked) {
          const minutes = Math.ceil(lockStatus.remainingTime / 60);
          throw new Error(
            `AccountLocked:${minutes}:Too many failed login attempts. Account locked for ${minutes} minute${minutes !== 1 ? 's' : ''}.`
          );
        }

        // We'll resolve a user object here and only return after verifying any expected role
        let resolvedUser = null;

        // 1) Try database-backed users first
        try {
          const client = await clientPromise;
          const db = client.db();
          const userDoc = await db.collection("users").findOne({ email });
          if (userDoc) {
            const valid = await comparePassword(password, userDoc.passwordHash);
            if (valid) {
              resolvedUser = {
                id: userDoc._id.toString(),
                name: userDoc.name || "User",
                email: userDoc.email,
                role: userDoc.role || "student",
              };
            } else {
              // If user exists but password invalid, fail immediately
              throw new Error("Invalid credentials");
            }
          }
        } catch (e) {
          // If DB is unreachable, fall back to demo users below
          console.warn("DB authorize fallback:", e?.message || e);
        }

        if (!resolvedUser && email === STUDENT_DEMO.email && password === STUDENT_DEMO.password) {
          resolvedUser = {
            id: "student-demo",
            name: "Student",
            email,
            role: "student",
          };
        }

        if (!resolvedUser && email === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
          resolvedUser = {
            id: "admin-demo",
            name: "Admin",
            email,
            role: "admin",
          };
        }

        if (!resolvedUser) {
          // Record failed attempt
          const attemptResult = recordFailedAttempt(email);
          
          if (attemptResult.locked) {
            const minutes = Math.ceil(attemptResult.remainingTime / 60);
            throw new Error(
              `AccountLocked:${minutes}:Too many failed login attempts. Account locked for ${minutes} minute${minutes !== 1 ? 's' : ''}.`
            );
          }
          
          // Add progressive delay if configured
          if (attemptResult.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, attemptResult.delay));
          }
          
          const remaining = attemptResult.remainingAttempts;
          throw new Error(
            `InvalidCredentials:${remaining}:Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          );
        }

        // Enforce portal-role match when an expectedRole is provided
        if (expectedRole && resolvedUser.role !== expectedRole) {
          // Record failed attempt for role mismatch too
          recordFailedAttempt(email);
          throw new Error("RoleMismatch");
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(email);

        return resolvedUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every 1 hour
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign-in, copy role and name from user and set issued time
      if (user) {
        token.role = user.role;
        if (user.name) token.name = user.name;
        token.iat = Math.floor(Date.now() / 1000); // Issued at time
      }

      // Check if token has expired (24 hours)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat || 0);
      if (tokenAge > 24 * 60 * 60) {
        return null; // Force re-authentication
      }

      // When a client calls useSession().update({ ... }), propagate allowed fields
      if (trigger === "update") {
        if (session?.name) token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) {
        return null; // Invalid session
      }
      
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
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
