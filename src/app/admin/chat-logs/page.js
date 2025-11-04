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

  return <ChatLogsClient />;
}
