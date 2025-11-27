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
    <div className="min-h-screen bg-(--bg-1) px-4 pt-16 pb-8 lg:p-8 min-[1440px]:pl-[300px] min-[1440px]:pt-4 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="h-[calc(100vh-4rem)] rounded-3xl border border-(--stroke) bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)] flex">
        {/* Chat Messages Area */}
        <ChatInterface userName={session.user?.name} showHistorySidebar={true} />
      </main>
    </div>
  );
}
