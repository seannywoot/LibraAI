import SignOutButton from "@/components/sign-out-button";

export default function DashboardPage() {
  // Route access is enforced by middleware; this component doesn't need to read cookies.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-6 py-12 text-zinc-900">
      <div className="w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-2xl shadow-zinc-900/5">
        <header className="flex flex-col gap-6 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
              LibraAI Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Good afternoon, Study Explorer
            </h1>
            <p className="text-sm text-zinc-600">
              Here&apos;s a quick snapshot of your academic library workspace. Upload resources, explore AI-generated summaries, and keep your study materials organized from one central hub.
            </p>
          </div>
          <SignOutButton className="border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" />
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
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

        <footer className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6 text-xs text-zinc-500">
          Tip: Return to the login page to sign out or explore the demo again.
        </footer>
      </div>
    </div>
  );
}
