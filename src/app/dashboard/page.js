import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  const role = session.user?.role;
  if (role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/student/dashboard");
}
