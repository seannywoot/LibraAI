import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FAQContent from "./faq-content";

export default async function StudentFAQPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }
  if (session.user?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const navigationLinks = getStudentLinks();

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />
      <FAQContent />
    </div>
  );
}
