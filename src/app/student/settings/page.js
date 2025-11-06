import { redirect } from "next/navigation";

export default function StudentSettingsPage() {
  // Merge: redirect settings to the unified Profile & Settings page
  redirect("/student/profile");
}
