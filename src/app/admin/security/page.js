"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";

export default function SecurityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/student/dashboard");
    }
  }, [status, session, router]);

  const fetchLockedAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/security/locked-accounts");
      const data = await response.json();

      if (data.success) {
        setLockedAccounts(data.lockedAccounts || []);
      } else {
        setError(data.error || "Failed to fetch locked accounts");
      }
    } catch (err) {
      setError("Failed to fetch locked accounts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchLockedAccounts();
    }
  }, [status, session]);

  const handleUnlock = async (identifier) => {
    try {
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/security/locked-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock", identifier }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Account ${identifier} has been unlocked`);
        fetchLockedAccounts();
      } else {
        setError(data.error || "Failed to unlock account");
      }
    } catch (err) {
      setError("Failed to unlock account");
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Security Management</h1>
            <p className="text-sm text-zinc-600">Monitor and manage account security</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              ← Back to Dashboard
            </Link>
            <SignOutButton className="bg-[var(--btn-primary)] text-white hover:bg-[var(--btn-primary-hover)]" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Locked Accounts</h2>
          <button
            onClick={fetchLockedAccounts}
            className="rounded-lg bg-[var(--btn-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--btn-primary-hover)]"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {successMessage}
          </div>
        )}

        {lockedAccounts.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-zinc-600">No accounts are currently locked</p>
            <p className="mt-2 text-sm text-zinc-500">
              Accounts are automatically locked after 5 failed login attempts
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Failed Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Locked At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Time Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {lockedAccounts.map((account) => (
                    <tr key={account.identifier} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 text-sm text-zinc-900">
                        {account.identifier}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {account.attempts}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {new Date(account.lockedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {Math.ceil(account.remainingTime / 60)} minutes
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleUnlock(account.identifier)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Unlock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {lockedAccounts.map((account) => (
                <div key={account.identifier} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-900">{account.identifier}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Locked at {new Date(account.lockedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                      Locked
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600">
                    <div>
                      <span className="block text-xs font-medium text-zinc-500 mb-0.5">Failed Attempts</span>
                      {account.attempts}
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-zinc-500 mb-0.5">Time Remaining</span>
                      {Math.ceil(account.remainingTime / 60)} mins
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnlock(account.identifier)}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    Unlock Account
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Security Settings</h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Maximum failed attempts:</span>
              <span className="font-medium text-zinc-900">5 attempts</span>
            </div>
            <div className="flex justify-between">
              <span>Lockout duration:</span>
              <span className="font-medium text-zinc-900">15 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Attempt tracking window:</span>
              <span className="font-medium text-zinc-900">15 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Progressive delays:</span>
              <span className="font-medium text-zinc-900">Enabled</span>
            </div>
          </div>
        </div>
      </main>
    </div >
  );
}
