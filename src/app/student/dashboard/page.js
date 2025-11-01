import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ClientUserName from "@/components/ClientUserName";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const navigationLinks = [
    {
      key: "student-dashboard",
      label: "Dashboard",
      href: "/student/dashboard",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-5h4v5h5V9.5"/></svg>
      ),
    },
    {
      key: "student-profile",
      label: "Profile",
      href: "/student/profile",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>
      ),
    },
    {
      key: "student-settings",
      label: "Settings",
      href: "/student/settings",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.06 1.64V21a2 2 0 1 1-4 0v-.08a1.8 1.8 0 0 0-1.06-1.64 1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 5 15.4a1.8 1.8 0 0 0-1.64-1.06H3a2 2 0 1 1 0-4h.08A1.8 1.8 0 0 0 4.72 8.2a1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 9.17 3c.72 0 1.37-.43 1.64-1.06V2a2 2 0 1 1 4 0v.08c.27.63.92 1.06 1.64 1.06.54 0 1.06-.22 1.44-.59l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.37.37-.59.9-.59 1.44 0 .72.43 1.37 1.06 1.64H22a2 2 0 1 1 0 4h-.08c-.63.27-1.06.92-1.06 1.64Z"/></svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="LibraAI Student"
        tagline="Student"
        links={navigationLinks}
        variant="light"
        footer="Jump back into your personalized study hub whenever you like."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-10 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
          <header className="space-y-4 border-b border-zinc-200 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
              LibraAI Dashboard
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Good afternoon, <ClientUserName />
              </h1>
              <p className="text-sm text-zinc-600">
                Here&apos;s a quick snapshot of your academic library workspace. Upload resources, explore AI-generated summaries, and keep your study materials organized from one central hub.
              </p>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
              <h2 className="text-base font-semibold text-zinc-900">Recent Highlights</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" aria-hidden />
                  3 new journal articles recommended based on your AI Ethics syllabus.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-400" aria-hidden />
                  12 lecture notes auto-tagged and summarized for quick revision.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-400" aria-hidden />
                  Shared reading list updated with 4 new resources from your study group.
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
              <h2 className="text-base font-semibold text-zinc-900">Quick Actions</h2>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                  type="button"
                >
                  Upload resource
                </button>
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                  type="button"
                >
                  Generate study summary
                </button>
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                  type="button"
                >
                  Share reading list
                </button>
              </div>
            </article>
          </section>

          <footer className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6 text-xs text-zinc-500">
            Tip: Return to the login page to sign out or explore the demo again.
          </footer>
      </main>
    </div>
  );
}
