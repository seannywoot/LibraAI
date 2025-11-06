import { redirect } from "next/navigation";

export default function AdminSettingsPage() {
  // Merge: redirect settings to the unified Profile & Settings page
  redirect("/admin/profile");
}
