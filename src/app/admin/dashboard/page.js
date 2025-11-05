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
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

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

        <DashboardClient />

        <footer className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-4 text-xs text-zinc-500">
          Tip: Return to the /auth page to switch between student and admin demo accounts.
        </footer>
      </main>
    </div>
  );
}
