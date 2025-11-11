"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UnansweredQueriesAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, showResolved]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/analytics/unanswered?resolved=${showResolved}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDuplicates = async () => {
    try {
      setInspecting(true);
      setInspectionResult(null);
      
      const response = await fetch('/api/admin/inspect-duplicates');
      const data = await response.json();
      
      if (data.success) {
        setInspectionResult(data);
      } else {
        alert('Inspection failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during inspection:', error);
      alert('Inspection failed: ' + error.message);
    } finally {
      setInspecting(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!confirm('This will merge duplicate entries. Continue?')) {
      return;
    }

    try {
      setCleaningUp(true);
      setCleanupResult(null);
      
      const response = await fetch('/api/admin/cleanup-duplicates', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCleanupResult(data);
        // Refresh analytics after cleanup
        await fetchAnalytics();
      } else {
        alert('Cleanup failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('Cleanup failed: ' + error.message);
    } finally {
      setCleaningUp(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Unanswered Queries Analytics</h1>
          <p className="text-zinc-600 mt-2">
            Track queries that users had to ask multiple times (indicating AI didn&apos;t answer properly)
          </p>
        </div>

        {/* Inspection Result */}
        {inspectionResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Data Inspection Results
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Total documents: {inspectionResult.totalDocuments}
                </p>
                {inspectionResult.duplicateGroups.length > 0 ? (
                  <div className="bg-white rounded-lg border border-blue-200 p-4 mb-3">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Found {inspectionResult.duplicateGroups.length} duplicate groups:
                    </p>
                    <ul className="space-y-2 text-sm text-blue-800">
                      {inspectionResult.duplicateGroups.map((group, idx) => (
                        <li key={idx} className="border-b border-blue-100 pb-2">
                          <div className="font-medium">&quot;{group.query}&quot; - {group.count} entries</div>
                          <div className="text-xs mt-1 space-y-1">
                            {group.docs.map((doc, docIdx) => (
                              <div key={docIdx} className="ml-4">
                                • {doc.userName} - {new Date(doc.timestamp).toLocaleString()}
                                {doc.conversationId && ` (Conv: ${doc.conversationId.substring(0, 8)}...)`}
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-blue-800">No duplicates found!</p>
                )}
                <details className="mt-3">
                  <summary className="text-sm font-medium text-blue-900 cursor-pointer">
                    View Sample Documents ({inspectionResult.sampleDocuments.length})
                  </summary>
                  <pre className="mt-2 text-xs bg-white rounded border border-blue-200 p-3 overflow-auto max-h-96">
                    {JSON.stringify(inspectionResult.sampleDocuments, null, 2)}
                  </pre>
                </details>
              </div>
              <button
                onClick={() => setInspectionResult(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Cleanup Result */}
        {cleanupResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Cleanup Complete!
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Merged {cleanupResult.summary.groupsMerged} groups, deleted {cleanupResult.summary.duplicatesDeleted} duplicate entries.
                </p>
                {cleanupResult.mergedQueries.length > 0 && (
                  <div className="bg-white rounded-lg border border-green-200 p-4">
                    <p className="text-sm font-medium text-green-900 mb-2">Merged Queries:</p>
                    <ul className="space-y-1 text-sm text-green-800">
                      {cleanupResult.mergedQueries.map((item, idx) => (
                        <li key={idx}>
                          &quot;{item.query}&quot; - {item.duplicates} duplicates → {item.totalAttempts} total attempts
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setCleanupResult(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {analytics?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="text-sm text-zinc-600 mb-1">Total Unanswered</div>
              <div className="text-3xl font-bold text-zinc-900">
                {analytics.statistics.totalUnansweredQueries}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="text-sm text-zinc-600 mb-1">Total Attempts</div>
              <div className="text-3xl font-bold text-zinc-900">
                {analytics.statistics.totalAttempts}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="text-sm text-zinc-600 mb-1">Avg Attempts/Query</div>
              <div className="text-3xl font-bold text-zinc-900">
                {analytics.statistics.avgAttemptsPerQuery}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="text-sm text-zinc-600 mb-1">Users Affected</div>
              <div className="text-3xl font-bold text-zinc-900">
                {analytics.statistics.uniqueUsersAffected}
              </div>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setShowResolved(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !showResolved
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Unresolved
          </button>
          <button
            onClick={() => setShowResolved(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showResolved
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Resolved
          </button>
          <button
            onClick={handleInspectDuplicates}
            disabled={inspecting}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inspecting ? 'Inspecting...' : 'Inspect Data'}
          </button>
          <button
            onClick={handleCleanupDuplicates}
            disabled={cleaningUp}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cleaningUp ? 'Cleaning...' : 'Cleanup Duplicates'}
          </button>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-white text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
          >
            Refresh
          </button>
        </div>

        {/* Top Unanswered Queries */}
        <div className="bg-white rounded-xl border border-zinc-200 mb-8">
          <div className="border-b border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-900">
              Most Problematic Queries
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Queries that users had to repeat most often
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-900">Query</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-900">Occurrences</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-900">Total Attempts</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-900">Avg Time Between</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-900">Users Affected</th>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-900">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.topUnanswered?.map((item, index) => (
                  <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-4 text-sm text-zinc-900 font-medium max-w-md">
                      {item.query}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                        {item.occurrences}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600 text-center">
                      {item.totalAttempts}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 text-center">
                      {item.avgTimeBetweenAttempts}s
                    </td>
                    <td className="p-4 text-sm text-zinc-600 text-center">
                      {item.affectedUsers}
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {new Date(item.lastSeen).toLocaleString()}
                    </td>
                  </tr>
                ))}
                
                {analytics?.topUnanswered?.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-zinc-500">
                      {showResolved 
                        ? "No resolved queries yet"
                        : "No unanswered queries - great job! 🎉"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Unanswered Queries */}
        {!showResolved && (
          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="border-b border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-900">
                Recent Unanswered Queries
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                Latest queries that users had to repeat
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-900">Query</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-900">User</th>
                    <th className="text-center p-4 text-sm font-semibold text-zinc-900">Attempts</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-900">Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recentUnanswered?.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="p-4 text-sm text-zinc-900 max-w-md">
                        {item.query}
                      </td>
                      <td className="p-4 text-sm text-zinc-600">
                        {item.user}
                      </td>
                      <td className="p-4 text-sm text-zinc-600 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                          {item.attempts}x
                        </span>
                      </td>
                      <td className="p-4 text-sm text-zinc-600">
                        {new Date(item.lastAttempt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  
                  {analytics?.recentUnanswered?.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-500">
                        No recent unanswered queries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
