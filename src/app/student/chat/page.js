import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat-interface";

export default async function StudentChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const navigationLinks = getStudentLinks();

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="h-[calc(100vh-4rem)] rounded-3xl border border-(--stroke) bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)] flex">
        {/* Chat Messages Area */}
        <ChatInterface userName={session.user?.name} />

        {/* Sidebar - Recommendations */}
        <div className="w-80 border-l border-zinc-200 bg-zinc-50 p-6 overflow-y-auto">
          {/* Personalized Recommendations */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Personalized Recommendations</h2>
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">The Quantum Garden</h3>
                  <p className="text-xs text-zinc-600">Derek Künsken</p>
                  <p className="text-xs text-zinc-500">2025</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">Neural Storm</h3>
                  <p className="text-xs text-zinc-600">Maya Chen</p>
                  <p className="text-xs text-zinc-500">2025</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">Stellar Echoes</h3>
                  <p className="text-xs text-zinc-600">Alex Rodriguez</p>
                  <p className="text-xs text-zinc-500">2025</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recently Viewed */}
          <section>
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recently Viewed</h2>
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">Dune: Prophecy</h3>
                  <p className="text-xs text-zinc-600">Brian Herbert</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">Foundation&apos;s Edge</h3>
                  <p className="text-xs text-zinc-600">Isaac Asimov</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300">
                <div className="h-16 w-12 shrink-0 rounded bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Book Cover</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">Project Hail Mary</h3>
                  <p className="text-xs text-zinc-600">Andy Weir</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
