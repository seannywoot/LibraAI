import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role !== "admin") {
    redirect("/student/dashboard");
  }

  const navigationLinks = [
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <DashboardSidebar
          heading="LibraAI Admin"
          tagline="Admin"
          links={navigationLinks}
          variant="admin"
          footer="Monitor usage insights, approve content, and keep the campus library humming."
          SignOutComponent={SignOutButton}
        />

        <main className="flex-1 space-y-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/70 backdrop-blur">
          <header className="space-y-4 border-b border-slate-800 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
              LibraAI Admin Dashboard
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Welcome back, Library Steward
              </h1>
              <p className="text-sm text-slate-400">
                Monitor library engagement, curate featured collections, and keep your academic community organized from a single AI-assisted console.
              </p>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
              <h2 className="text-base font-semibold text-white">Usage insights</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" aria-hidden />
                  182 active students this week with a 14% uptick in AI-generated summaries.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-400" aria-hidden />
                  Most searched topic: &ldquo;Machine Learning Interpretability&rdquo;.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-400" aria-hidden />
                  9 flagged requests awaiting librarian review.
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
              <h2 className="text-base font-semibold text-white">Priority actions</h2>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                  type="button"
                >
                  Review flagged content
                </button>
                <button
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                  type="button"
                >
                  Publish featured collection
                </button>
                <button
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                  type="button"
                >
                  Export engagement report
                </button>
              </div>
            </article>
          </section>

          <footer className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-4 text-xs text-slate-400">
            Tip: Return to the /auth page to switch between student and admin demo accounts.
          </footer>
        </main>
      </div>
    </div>
  );
}
