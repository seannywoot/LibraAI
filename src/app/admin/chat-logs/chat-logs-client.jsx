"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { MessageCircle } from "@/components/icons";

export default function ChatLogsClient() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUserId, setSearchUserId] = useState("");
  const [expandedLog, setExpandedLog] = useState(null);

  const navigationLinks = getAdminLinks();

  useEffect(() => {
    fetchLogs();
  }, [page, searchUserId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        skip: ((page - 1) * 20).toString(),
      });

      if (searchUserId) {
        params.append("userId", searchUserId);
      }

      const response = await fetch(`/api/chat/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-800 mb-2">
            Chat Conversation Logs
          </h1>
          <p className="text-zinc-600">
            View and monitor all chat interactions with LibraAI Assistant
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Search by user email..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition"
            >
              Search
            </button>
            {searchUserId && (
              <button
                type="button"
                onClick={() => {
                  setSearchUserId("");
                  setPage(1);
                }}
                className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Logs List */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No chat logs found.</div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {logs.map((log) => (
                <div key={log._id} className="p-6 hover:bg-zinc-50 transition">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {log.userName}
                          </p>
                          <p className="text-xs text-zinc-500">{log.userId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Message #{log.messageCount}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-lg bg-zinc-100 p-3">
                          <p className="text-xs font-semibold text-zinc-600 mb-1">
                            User Question:
                          </p>
                          <p className="text-sm text-zinc-800">
                            {expandedLog === log._id
                              ? log.userMessage
                              : log.userMessage.slice(0, 150) +
                                (log.userMessage.length > 150 ? "..." : "")}
                          </p>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-blue-600 mb-1">
                            AI Response:
                          </p>
                          <p className="text-sm text-blue-900">
                            {expandedLog === log._id
                              ? log.aiResponse
                              : log.aiResponse.slice(0, 150) +
                                (log.aiResponse.length > 150 ? "..." : "")}
                          </p>
                        </div>

                        {(log.userMessage.length > 150 ||
                          log.aiResponse.length > 150) && (
                          <button
                            onClick={() =>
                              setExpandedLog(
                                expandedLog === log._id ? null : log._id
                              )
                            }
                            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                          >
                            {expandedLog === log._id ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>

                      {log.conversationId && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-zinc-100 text-zinc-600 rounded">
                            Conversation ID: {log.conversationId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-zinc-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
