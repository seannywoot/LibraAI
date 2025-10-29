import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.role = token.role;
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
