import DashboardSidebar from "@/components/dashboard-sidebar";
import { Home, User, Settings, Book, BookOpen } from "@/components/icons";
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
      icon: <Home className="h-4 w-4" />,
    },
    {
      key: "student-books",
      label: "Browse Books",
      href: "/student/books",
      exact: true,
      icon: <Book className="h-4 w-4" />,
    },
    {
      key: "student-borrowed",
      label: "My Books",
      href: "/student/borrowed",
      exact: true,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      key: "student-profile",
      label: "Profile",
      href: "/student/profile",
      exact: true,
      icon: <User className="h-4 w-4" />,
    },
    {
      key: "student-settings",
      label: "Settings",
      href: "/student/settings",
      exact: true,
      icon: <Settings className="h-4 w-4" />,
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
                <a
                  href="/student/books"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                >
                  Browse available books
                </a>
                <a
                  href="/student/borrowed"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                >
                  View my borrowed books
                </a>
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                  type="button"
                >
                  Generate study summary
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
