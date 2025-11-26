import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ClientUserName from "@/components/ClientUserName";
import DashboardClient from "./dashboard-client";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role !== "admin") {
    redirect("/student/dashboard");
  }

  const navigationLinks = getAdminLinks();

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-10 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-600">
              Monitor library engagement, curate featured collections, and keep your academic community organized from a single AI-assisted console.
            </p>
          </div>
          <a
            href="/admin/faq-setup#add"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--btn-primary)] bg-[var(--btn-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--btn-primary-hover)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add FAQ
          </a>
        </header>

        <DashboardClient />
      </main>
    </div>
  );
}
