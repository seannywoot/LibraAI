"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";

export default function FAQSetupClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const navigationLinks = getAdminLinks();

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/faq/seed", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Failed to seed FAQs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-800 mb-2">
            FAQ Database Setup
          </h1>
          <p className="text-zinc-600">
            Initialize the FAQ database with default questions and answers
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              Seed FAQ Database
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              This will clear all existing FAQs and populate the database with 11 default FAQs across 4 categories:
            </p>
            <ul className="text-sm text-zinc-600 space-y-1 mb-6 ml-4">
              <li>• Borrowing (4 FAQs)</li>
              <li>• Hours (2 FAQs)</li>
              <li>• Facilities (3 FAQs)</li>
              <li>• Policies (2 FAQs)</li>
            </ul>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <p className="text-sm text-amber-800">
                ⚠️ Warning: This will delete all existing FAQs before seeding new ones.
              </p>
            </div>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Seeding Database..." : "Seed FAQ Database"}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">
                ✅ Success!
              </p>
              <p className="text-sm text-green-700">
                {result.message} - {result.count} FAQs added to the database.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">
                ❌ Error
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="text-sm font-semibold text-zinc-800 mb-3">
            Next Steps
          </h3>
          <ul className="text-sm text-zinc-600 space-y-2">
            <li>• Visit the FAQ page to see the seeded questions</li>
            <li>• Test the chatbot - it now uses the FAQ database</li>
            <li>• Use the FAQ API to manage questions programmatically</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
