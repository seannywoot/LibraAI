import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ChatLogsClient from "./chat-logs-client";

export default async function ChatLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user?.role !== "admin") {
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 min-[1440px]:pl-[300px] text-(--text)">
      <main className="space-y-10 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <ChatLogsClient />
      </main>
    </div>
  );
}
