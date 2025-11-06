import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { comparePassword } from "@/lib/passwords";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/brute-force-protection";
import {
  notifyAccountLockout,
  trackFailedLogin,
  isNewAdminDevice,
  notifyNewAdminLogin,
} from "@/lib/security-notifications";

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
        // Security tracking
        ipAddress: { label: "IP Address", type: "text" },
        userAgent: { label: "User Agent", type: "text" },
      },
      async authorize(credentials, req) {
        console.log('[AUTH] Authorize called with email:', credentials?.email);
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password || "";
        const expectedRole = (credentials?.expectedRole || "").trim().toLowerCase();

        if (!email || !password) {
          console.log('[AUTH] Missing credentials');
          throw new Error("Missing credentials");
        }

        // Check if account is locked due to too many failed attempts
        const lockStatus = isAccountLocked(email);
        if (lockStatus.locked) {
          const minutes = Math.ceil(lockStatus.remainingTime / 60);
          console.log('[AUTH] Account locked:', email);
          throw new Error(
            `AccountLocked:${minutes}:Too many failed login attempts. Account locked for ${minutes} minute${minutes !== 1 ? 's' : ''}.`
          );
        }

        // We'll resolve a user object here and only return after verifying any expected role
        let resolvedUser = null;
        let dbUserExists = false;

        // 1) Try database-backed users first
        try {
          const client = await clientPromise;
          // Use default database (test) - or specify via MONGODB_DB_NAME env var
          const db = client.db(process.env.MONGODB_DB_NAME || "test");
          const userDoc = await db.collection("users").findOne({ email });
          console.log('[AUTH] DB user lookup:', email, userDoc ? 'found' : 'not found');
          if (userDoc) {
            dbUserExists = true;
            const valid = await comparePassword(password, userDoc.passwordHash);
            console.log('[AUTH] Password validation:', valid ? 'success' : 'failed');
            if (valid) {
              resolvedUser = {
                id: userDoc._id.toString(),
                name: userDoc.name || "User",
                email: userDoc.email,
                role: userDoc.role || "student",
              };
            }
            // If password invalid, resolvedUser stays null but we know user exists
          }
        } catch (e) {
          // If DB is unreachable, fall back to demo users below
          console.warn("[AUTH] DB authorize fallback:", e?.message || e);
        }

        // Only try demo accounts if user doesn't exist in database
        if (!resolvedUser && !dbUserExists) {
          console.log('[AUTH] Trying demo accounts for:', email);
          if (email === STUDENT_DEMO.email && password === STUDENT_DEMO.password) {
            console.log('[AUTH] Student demo match');
            resolvedUser = {
              id: "student-demo",
              name: "Student",
              email,
              role: "student",
            };
          } else if (email === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
            console.log('[AUTH] Admin demo match');
            resolvedUser = {
              id: "admin-demo",
              name: "Admin",
              email,
              role: "admin",
            };
          }
        }

        if (!resolvedUser) {
          console.log('[AUTH] No user resolved, recording failed attempt');
          
          // Track failed login for spike detection
          trackFailedLogin({
            email,
            ipAddress: credentials?.ipAddress || 'unknown',
            timestamp: Date.now(),
          });
          
          // Record failed attempt
          const attemptResult = recordFailedAttempt(email);
          
          if (attemptResult.locked) {
            const minutes = Math.ceil(attemptResult.remainingTime / 60);
            
            // Send lockout notification to admins (async, don't wait)
            notifyAccountLockout({
              lockedEmail: email,
              role: expectedRole || 'unknown',
              attempts: attemptResult.attempts,
              lockWindowMinutes: minutes,
            }).catch(err => console.error('[AUTH] Failed to send lockout notification:', err));
            
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
          console.log('[AUTH] Role mismatch:', resolvedUser.role, 'vs expected', expectedRole);
          // Record failed attempt for role mismatch too
          recordFailedAttempt(email);
          throw new Error("RoleMismatch");
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(email);
        console.log('[AUTH] Login successful for:', email, 'role:', resolvedUser.role);

        // Check for new admin device login
        if (resolvedUser.role === 'admin') {
          const userAgent = credentials?.userAgent || 'Unknown';
          const ipAddress = credentials?.ipAddress || 'unknown';
          
          const isNew = isNewAdminDevice({
            email,
            ipAddress,
            userAgent,
          });
          
          if (isNew) {
            console.log('[AUTH] New admin device detected for:', email);
            // Send new device notification (async, don't wait)
            notifyNewAdminLogin({
              loginEmail: email,
              ipAddress,
              userAgent,
              location: 'Unknown', // Could integrate IP geolocation service
            }).catch(err => console.error('[AUTH] Failed to send new device notification:', err));
          }
        }

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

      // Rely on NextAuth's built-in maxAge handling instead of hard-nullifying the token.
      // Returning null here can cause client-side JSON parse errors when the session endpoint
      // responds with an empty body. We'll let NextAuth manage session expiration via maxAge.

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
