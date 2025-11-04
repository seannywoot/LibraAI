import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FAQSetupClient from "./faq-setup-client";

export default async function FAQSetupPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth");
  }
  
  if (session.user?.role !== "admin") {
    redirect("/student/dashboard");
  }

  return <FAQSetupClient />;
}
