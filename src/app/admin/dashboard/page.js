import DashboardSidebar from "@/components/dashboard-sidebar";
import { Home, Book, Plus, Users, Library as LibraryIcon, User, Settings, History } from "@/components/icons";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ClientUserName from "@/components/ClientUserName";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role !== "admin") {
    redirect("/student/dashboard");
  }

  const navigationLinks = [
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "admin-books", label: "Books", href: "/admin/books", exact: true, icon: <Book className="h-4 w-4" /> },
    { key: "admin-add-book", label: "Add Book", href: "/admin/books/add", exact: true, icon: <Plus className="h-4 w-4" /> },
    { key: "admin-transactions", label: "Transactions", href: "/admin/transactions", exact: true, icon: <History className="h-4 w-4" /> },
    { key: "admin-authors", label: "Authors", href: "/admin/authors", exact: true, icon: <Users className="h-4 w-4" /> },
    { key: "admin-shelves", label: "Shelves", href: "/admin/shelves", exact: true, icon: <LibraryIcon className="h-4 w-4" /> },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="LibraAI Admin"
        tagline="Admin"
        links={navigationLinks}
        variant="light"
        footer="Monitor usage insights, approve content, and keep the campus library humming."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-10 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-4 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
            LibraAI Admin Dashboard
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Welcome back, <ClientUserName fallback="Library Steward" />
            </h1>
            <p className="text-sm text-zinc-600">
              Monitor library engagement, curate featured collections, and keep your academic community organized from a single AI-assisted console.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5 text-sm text-zinc-700">
            <h2 className="text-base font-semibold text-zinc-900">Usage insights</h2>
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

          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5 text-sm text-zinc-700">
            <h2 className="text-base font-semibold text-zinc-900">Priority actions</h2>
            <div className="mt-4 grid gap-3">
              <a
                href="/admin/books/add"
                className="rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Add a new book
              </a>
              <a
                href="/admin/transactions"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                View borrow transactions
              </a>
              <button
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                type="button"
              >
                Review flagged content
              </button>
              <button
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900"
                type="button"
              >
                Export engagement report
              </button>
            </div>
          </article>
        </section>

        <footer className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-4 text-xs text-zinc-500">
          Tip: Return to the /auth page to switch between student and admin demo accounts.
        </footer>
      </main>
    </div>
  );
}
