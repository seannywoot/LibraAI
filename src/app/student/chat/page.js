import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { MessageCircle, Send, Paperclip } from "@/components/icons";

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
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-zinc-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">LibraAI Assistant</h1>
                <p className="text-sm text-zinc-500">Ask me anything about literature</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="max-w-[70%] rounded-2xl bg-zinc-100 px-4 py-3">
                <p className="text-sm text-zinc-800">
                  Hello! I&apos;m here to help you find books and answer questions about literature. What can I help you with today?
                </p>
                <span className="mt-1 block text-xs text-zinc-500">10:30 AM</span>
              </div>
            </div>

            {/* User Message */}
            <div className="flex justify-end gap-3">
              <div className="max-w-[70%] rounded-2xl bg-zinc-900 px-4 py-3">
                <p className="text-sm text-white">
                  Can you recommend some science fiction books from 2025?
                </p>
                <span className="mt-1 block text-xs text-zinc-400">10:32 AM</span>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
                <span className="text-xs font-semibold">{session.user?.name?.[0] || "U"}</span>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="max-w-[70%] rounded-2xl bg-zinc-100 px-4 py-3">
                <p className="text-sm text-zinc-800">
                  I&apos;d be happy to recommend some great science fiction books from 2025! Here are a few excellent options...
                </p>
                <span className="mt-1 block text-xs text-zinc-500">10:33 AM</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-200 p-6">
            <div className="flex items-end gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                aria-label="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <textarea
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

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
