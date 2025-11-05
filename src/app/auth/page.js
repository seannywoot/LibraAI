"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const STUDENT_DEMO_EMAIL = "student@demo.edu";
const STUDENT_DEMO_PASSWORD = "ReadSmart123";
const ADMIN_DEMO_EMAIL = "admin@libra.ai";
const ADMIN_DEMO_PASSWORD = "ManageStacks!";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("student"); // 'student' | 'admin'

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get logout reason from URL
  const logoutReason = searchParams.get("reason");
  const logoutMessage = logoutReason === "idle"
    ? "You were logged out due to inactivity for security reasons."
    : logoutReason === "expired"
    ? "Your session has expired. Please sign in again."
    : null;

  const [studentRemember, setStudentRemember] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return sessionStorage.getItem("libraai-demo-remember") === "true";
    } catch {
      return false;
    }
  });

  const [studentEmail, setStudentEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    try {
      return sessionStorage.getItem("libraai-demo-remember") === "true" ? STUDENT_DEMO_EMAIL : "";
    } catch {
      return "";
    }
  });

  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const attemptLogin = async ({ role, email, password, remember = false }) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const setError = role === "student" ? setStudentError : setAdminError;
    setError("");

    try {
      const redirectParam = searchParams.get("redirect");
      const defaultDestination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      let destination = defaultDestination;

      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        if (role === "admin") {
          destination = redirectParam.startsWith("/admin") ? redirectParam : defaultDestination;
        } else {
          destination = redirectParam.startsWith("/admin") ? defaultDestination : redirectParam;
        }
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        expectedRole: role,
      });

      console.log('SignIn result:', { ok: result?.ok, error: result?.error, url: result?.url, status: result?.status });

      if (!result || result.error) {
        console.error('Login failed:', { result, error: result?.error });
        const defaultCopy =
          role === "student"
            ? "Those credentials don’t match the student demo account. Use the demo credentials below."
            : "Those credentials don’t match the admin demo account. Use the demo credentials below.";

        let errorMessage = "Unable to sign in. Check your credentials and try again.";

        // Handle account locked errors
        if (result?.error?.startsWith("AccountLocked:")) {
          const parts = result.error.split(":");
          const minutes = parts[1];
          errorMessage = `🔒 Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${minutes !== "1" ? "s" : ""}.`;
        }
        // Handle invalid credentials with remaining attempts
        else if (result?.error?.startsWith("InvalidCredentials:")) {
          const parts = result.error.split(":");
          const remaining = parts[1];
          errorMessage = `❌ Invalid credentials. You have ${remaining} attempt${remaining !== "1" ? "s" : ""} remaining before your account is temporarily locked.`;
        }
        // Handle role mismatch
        else if (result?.error === "RoleMismatch") {
          errorMessage = role === "student"
            ? "That account is an admin. Switch to the Admin tab to sign in."
            : "That account is a student. Switch to the Student tab to sign in.";
        }
        // Handle generic invalid credentials
        else if (result?.error === "Invalid credentials" || result?.error === "CredentialsSignin") {
          errorMessage = defaultCopy;
        }

        setError(errorMessage);
        return;
      }

      if (role === "student") {
        try {
          if (typeof window !== "undefined") {
            if (remember) {
              sessionStorage.setItem("libraai-demo-remember", "true");
            } else {
              sessionStorage.removeItem("libraai-demo-remember");
            }
          }
        } catch (storageError) {
          console.error(storageError);
        }

        setStudentPassword("");
      } else {
        setAdminPassword("");
      }

      // Force a hard navigation instead of client-side routing
      const redirectUrl = result?.url || destination;
      console.log('Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error(error);
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    await attemptLogin({
      role: "student",
      email: studentEmail,
      password: studentPassword,
      remember: studentRemember,
    });
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    await attemptLogin({
      role: "admin",
      email: adminEmail,
      password: adminPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12 text-zinc-900">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 md:flex-row">
  <section className="relative hidden w-full max-w-sm flex-col justify-between bg-zinc-900 p-10 text-zinc-100 md:flex">
          <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900" aria-hidden />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">LibraAI</p>
            <h2 className="mt-6 text-3xl font-semibold leading-snug">
              Your AI-powered digital library companion.
            </h2>
            <p className="mt-4 text-sm text-zinc-400">
              Discover, access, and organize course materials faster with targeted recommendations and a unified library workspace.
            </p>
          </div>
          <ul className="relative z-10 space-y-4 text-sm text-zinc-200">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" aria-hidden />
              Natural conversation-based search for books and journals
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-400" aria-hidden />
              Personalized recommendations based on reading pattern
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-400" aria-hidden />
              Interactive tools such as notes and quizzes
            </li>
          </ul>
          <p className="relative z-10 text-xs text-zinc-500">
            Need help? Email <a className="font-medium text-zinc-100" href="mailto:support@libra.ai">support@libra.ai</a>
          </p>
        </section>

        <main className="flex w-full flex-1 flex-col justify-center px-8 py-12 sm:px-14">
          <div className="w-full max-w-2xl">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
                <p className="mt-2 text-sm text-zinc-600">
                  LibraAI is an AI-powered digital library assistant that simplifies how students discover, access, and manage educational resources.
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setMode("student")}
                  aria-pressed={mode === "student"}
                  className={`${mode === "student" ? "bg-white text-zinc-900 shadow" : "text-zinc-600 hover:text-zinc-900"} rounded-lg px-4 py-2 transition`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setMode("admin")}
                  aria-pressed={mode === "admin"}
                  className={`${mode === "admin" ? "bg-white text-zinc-900 shadow" : "text-zinc-600 hover:text-zinc-900"} rounded-lg px-4 py-2 transition`}
                >
                  Admin
                </button>
              </div>
            </header>

            {logoutMessage && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{logoutMessage}</span>
                </div>
              </div>
            )}

            <section className="rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-lg shadow-zinc-900/5">
              <form
                className="space-y-6"
                onSubmit={mode === "student" ? handleStudentSubmit : handleAdminSubmit}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700" htmlFor="email">
                    {mode === "student" ? "Email address" : "Admin email"}
                  </label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    id="email"
                    name="email"
                    type="email"
                    placeholder={mode === "student" ? "you@school.edu" : "librarian@libra.ai"}
                    autoComplete="email"
                    value={mode === "student" ? studentEmail : adminEmail}
                    onChange={(event) => (mode === "student" ? setStudentEmail(event.target.value) : setAdminEmail(event.target.value))}
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700" htmlFor="password">
                      Password
                    </label>
                    <Link className="text-xs font-semibold text-zinc-900 hover:text-zinc-700" href="/auth/forgot">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                      id="password"
                      name="password"
                      type={mode === "student" ? (showStudentPassword ? "text" : "password") : (showAdminPassword ? "text" : "password")}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={mode === "student" ? studentPassword : adminPassword}
                      onChange={(event) => (mode === "student" ? setStudentPassword(event.target.value) : setAdminPassword(event.target.value))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => mode === "student" ? setShowStudentPassword(!showStudentPassword) : setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                      aria-label={mode === "student" ? (showStudentPassword ? "Hide password" : "Show password") : (showAdminPassword ? "Hide password" : "Show password")}
                    >
                      {mode === "student" ? (showStudentPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )) : (showAdminPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ))}
                    </button>
                  </div>
                </div>

                {mode === "student" && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="inline-flex items-center gap-2 text-zinc-600" htmlFor="remember">
                      <input
                        className="h-4 w-4 rounded border border-zinc-300 text-zinc-900 focus:ring-zinc-900/20"
                        id="remember"
                        name="remember"
                        type="checkbox"
                        checked={studentRemember}
                        onChange={(event) => setStudentRemember(event.target.checked)}
                      />
                      Remember me
                    </label>
                  </div>
                )}

                {(mode === "student" ? studentError : adminError) && (
                  <div
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600"
                    role="alert"
                  >
                    {mode === "student" ? studentError : adminError}
                  </div>
                )}

                <button
                  className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:hover:bg-zinc-700"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Signing in..."
                    : mode === "student"
                      ? "Sign in as student"
                      : "Sign in as admin"}
                </button>
              </form>

              <div className="mt-6 space-y-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                <p className="font-semibold uppercase tracking-[0.25em] text-zinc-500">{mode === "student" ? "Student demo" : "Admin demo"}</p>
                {mode === "student" ? (
                  <>
                    <p>
                      Email: <span className="font-mono text-zinc-800">{STUDENT_DEMO_EMAIL}</span>
                    </p>
                    <p>
                      Password: <span className="font-mono text-zinc-800">{STUDENT_DEMO_PASSWORD}</span>
                    </p>
                    <p className="text-zinc-500">Use these credentials to explore the student dashboard experience.</p>
                  </>
                ) : (
                  <>
                    <p>
                      Email: <span className="font-mono text-zinc-800">{ADMIN_DEMO_EMAIL}</span>
                    </p>
                    <p>
                      Password: <span className="font-mono text-zinc-800">{ADMIN_DEMO_PASSWORD}</span>
                    </p>
                    <p className="text-zinc-500">These credentials unlock the admin dashboard experience.</p>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AuthPage() {
  // Wrap the content that uses useSearchParams in a Suspense boundary
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
