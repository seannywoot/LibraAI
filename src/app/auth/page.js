"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";

function useForceLightTheme() {
  const { setDarkModePreference, darkMode } = useTheme();
  const initialDarkMode = useRef(darkMode);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;
    const hadDarkClass = root.classList.contains("dark");
    const initialDatasetTheme = root.dataset.theme === "dark" ? "dark" : "light";
    const initialDarkPreference = initialDarkMode.current;
    // Force the auth route to render with the light theme while preserving the original preference for later pages.

    if (initialDatasetTheme !== "light" || hadDarkClass || initialDarkPreference) {
      setDarkModePreference(false, { persist: false });
    }

    return () => {
      const restoreDark = initialDarkPreference || initialDatasetTheme === "dark" || hadDarkClass;
      setDarkModePreference(restoreDark, { persist: false });
    };
  }, [setDarkModePreference]);
}

const STUDENT_DEMO_EMAIL = "seannpatrick25@gmail.com";
const STUDENT_DEMO_PASSWORD = "LibraAI_2025";
const ADMIN_DEMO_EMAIL = "libraaismartlibraryassistant@gmail.com";
const ADMIN_DEMO_PASSWORD = "LibraAI_2025";

function AuthContent() {
  useForceLightTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
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

  // Prevent authenticated users from accessing the auth page
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      console.log('[AUTH PAGE] User already authenticated, redirecting to:', destination);
      router.replace(destination);
    }
  }, [status, session, router]);

  // Handle browser back button - prevent staying on auth page when authenticated
  useEffect(() => {
    const handlePopState = () => {
      if (status === "authenticated" && session?.user) {
        const role = session.user.role;
        const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
        console.log('[AUTH PAGE] Back button pressed while authenticated, redirecting to:', destination);
        router.replace(destination);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading" || (status === "authenticated" && session?.user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C86F26] border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-sm text-zinc-600">Redirecting...</p>
        </div>
      </div>
    );
  }

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

      console.log('[CLIENT] Attempting login for:', email, 'role:', role, 'destination:', destination);

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        expectedRole: role,
      });

      console.log('[CLIENT] SignIn result:', { ok: result?.ok, error: result?.error, status: result?.status });

      if (!result?.ok || result?.error) {
        console.error('[CLIENT] Login failed:', { error: result?.error });
        const defaultCopy =
          role === "student"
            ? "Those credentials don’t match the student demo account. Use the demo credentials below."
            : "Those credentials don’t match the admin demo account. Use the demo credentials below.";

        const portalLabel = role === "student" ? "student" : "admin";

        let errorMessage = "Unable to sign in. Check your credentials and try again.";

        // Handle account locked errors
        if (result?.error?.startsWith("AccountLocked:")) {
          const parts = (result.error || "").split(":");
          const rawMinutes = parts[1];
          const reasonCode = parts[2];
          const minutesValue = Number.parseInt(rawMinutes, 10);
          const minutesDisplay = Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : (rawMinutes || "15");
          const minuteSuffix = Number.isFinite(minutesValue) && minutesValue === 1 ? "" : "s";

          // If lockout reason indicates the email doesn't exist, show the explicit message
          if (reasonCode === "account-not-found") {
            errorMessage = `We couldn’t find a ${portalLabel} account with that email address. Please check your spelling or Contact us at libraaismartlibraryassistant@gmail.com`;
          } else {
            let reasonCopy = "";
            if (reasonCode === "invalid-credentials") {
              reasonCopy = ` Repeated invalid credentials were entered for an existing ${portalLabel} account.`;
            } else if (reasonCode === "role-mismatch") {
              reasonCopy = " The lockout was triggered by signing in with the wrong portal for this account.";
            } else if (reasonCode === "unknown") {
              reasonCopy = " The system could not determine whether the account exists.";
            }

            errorMessage = `🔒 Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesDisplay} minute${minuteSuffix}.`;
            if (reasonCopy) {
              errorMessage += reasonCopy;
            }
          }
        }
        // Handle invalid credentials with remaining attempts
        else if (result?.error?.startsWith("InvalidCredentials:")) {
          const parts = (result.error || "").split(":");
          const rawRemaining = parts[1];
          const reasonCode = parts[2];
          const remainingValue = Number.parseInt(rawRemaining, 10);
          const remainingCopy = Number.isFinite(remainingValue) && remainingValue >= 0
            ? ` You have ${remainingValue} attempt${remainingValue === 1 ? "" : "s"} remaining before your account is temporarily locked.`
            : "";

          if (reasonCode === "account-not-found") {
            // For non-existing users, do NOT show remaining attempts since there's no account to lock
            errorMessage = `We couldn’t find a ${portalLabel} account with that email address. Please check your spelling or Contact us at libraaismartlibraryassistant@gmail.com`;
          } else if (reasonCode === "invalid-credentials") {
            errorMessage = `❌ Invalid credentials for an existing ${portalLabel} account. Double-check the password or use the demo credentials below.${remainingCopy}`;
          } else if (reasonCode === "role-mismatch") {
            errorMessage = `⚠️ That email belongs to a different portal. Switch to the correct tab and try again.${remainingCopy}`;
          } else if (reasonCode === "unknown") {
            errorMessage = `⚠️ The system couldn't verify whether this ${portalLabel} account exists. Please try again in a moment.${remainingCopy}`;
          } else {
            errorMessage = `${defaultCopy}${remainingCopy}`;
          }
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
        setIsSubmitting(false);
        return;
      }

      // Login successful
      console.log('[CLIENT] Login successful, preparing redirect to:', destination);

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
          console.error('[CLIENT] SessionStorage error:', storageError);
        }

        setStudentPassword("");
      } else {
        setAdminPassword("");
      }

      // Wait a brief moment for the session cookie to be set
      // This ensures the middleware will see the authenticated session
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now perform the redirect using replace to prevent back button to auth page
      console.log('[CLIENT] Redirecting to:', destination);
      window.location.replace(destination);
    } catch (error) {
      console.error('[CLIENT] Login exception:', error);
      setError("Unable to sign in right now. Please try again.");
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
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-100 px-4 sm:px-6 lg:px-8 text-zinc-900 overflow-hidden">
      {/* Mobile Header - Above Card */}
      <div className="md:hidden flex items-center justify-center gap-3 mb-4 shrink-0">
        <img src="/libraai-logo.png" alt="LibraAI" className="h-10 w-auto object-contain" />
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">LibraAI</h1>
      </div>

      <div className="flex w-full max-w-6xl max-h-[85vh] md:max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 md:flex-row">
        <section className="relative hidden w-full md:max-w-xs lg:max-w-sm flex-col justify-between bg-zinc-900 p-10 text-zinc-100 md:flex">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_#F4BC42,_#C86F26,_#802910)]" aria-hidden />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
            <img src="/libraai-logo.png" alt="LibraAI" className="h-24 w-auto object-contain mb-4 drop-shadow-lg" />
            <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
              LibraAI
            </h2>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-4 text-sm text-white/80">
              <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <a href="mailto:libraaismartlibraryassistant@gmail.com" className="text-white hover:underline">
                libraaismartlibraryassistant@gmail.com
              </a>
            </div>
          </div>
        </section>

        <main className="flex w-full flex-1 flex-col justify-center px-4 py-6 sm:px-10 sm:py-12 lg:px-14 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
                <p className="mt-2 text-sm text-zinc-600 hidden md:block">
                  LibraAI is an AI-powered digital library assistant that simplifies how students discover, access, and manage educational resources.
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setMode("student")}
                  aria-pressed={mode === "student"}
                  className={`${mode === "student" ? "bg-[linear-gradient(to_bottom,_#F4BC42,_#C86F26,_#802910)] text-white shadow" : "text-zinc-600 hover:text-zinc-900"} rounded-lg px-4 py-2 transition`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setMode("admin")}
                  aria-pressed={mode === "admin"}
                  className={`${mode === "admin" ? "bg-[linear-gradient(to_bottom,_#F4BC42,_#C86F26,_#802910)] text-white shadow" : "text-zinc-600 hover:text-zinc-900"} rounded-lg px-4 py-2 transition`}
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
                  className="flex w-full items-center justify-center rounded-xl bg-[linear-gradient(to_bottom,_#F4BC42,_#C86F26,_#802910)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C86F26] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:hover:bg-zinc-700"
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
          </div >
        </main >
      </div >
    </div >
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
