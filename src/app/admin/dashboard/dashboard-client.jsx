"use client";

import { useState, useEffect } from "react";
import { Search, HelpCircle, AlertTriangle, FileText, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, BookOpen, RotateCcw, Clock, X, Trash2 } from "lucide-react";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/confirm-dialog";
import { AdminTransactionChart } from "@/components/admin-transaction-chart";

export default function DashboardClient() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDataIndicator, setNewDataIndicator] = useState({});
  const [queriesPage, setQueriesPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [faqFormData, setFaqFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    keywords: ""
  });
  const [dismissTarget, setDismissTarget] = useState(null);
  const [dismissingId, setDismissingId] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queriesPage, feedbackPage]);

  const fetchAnalytics = async (isUpdate = false) => {
    try {
      const response = await fetch(`/api/admin/analytics?queriesPage=${queriesPage}&feedbackPage=${feedbackPage}`);
      const result = await response.json();

      if (result.success) {
        if (isUpdate && analytics) {
          // Check for new data
          const indicators = {};
          if (result.data.totalSearches > analytics.totalSearches) {
            indicators.searches = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, searches: false }));
            }, 3000);
          }
          if (result.data.totalFAQs > analytics.totalFAQs) {
            indicators.faqs = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, faqs: false }));
            }, 3000);
          }
          if (result.data.unansweredCount > analytics.unansweredCount) {
            indicators.unanswered = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, unanswered: false }));
            }, 3000);
          }
          if (result.data.pendingBorrowRequests > analytics.pendingBorrowRequests) {
            indicators.borrowRequests = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, borrowRequests: false }));
            }, 3000);
          }
          if (result.data.returnRequests > analytics.returnRequests) {
            indicators.returnRequests = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, returnRequests: false }));
            }, 3000);
          }
          if (result.data.activeTransactions > analytics.activeTransactions) {
            indicators.activeTransactions = true;
            setTimeout(() => {
              setNewDataIndicator(prev => ({ ...prev, activeTransactions: false }));
            }, 3000);
          }
          setNewDataIndicator(indicators);
        }
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToFAQ = (question) => {
    setSelectedQuestion(question);
    setFaqFormData({
      question: question.question,
      answer: "",
      category: "general",
      keywords: ""
    });
    setShowConvertModal(true);
  };

  const handleSubmitFAQ = async (e) => {
    e.preventDefault();
    setConvertLoading(true);

    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...faqFormData,
          keywords: faqFormData.keywords.split(",").map(k => k.trim()).filter(Boolean),
          sourceQuestionId: selectedQuestion.id // Include the source question ID
        })
      });
      const data = await response.json();

      if (data.success) {
        // Mark the question as converted in chat logs
        await fetch("/api/chat/logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logId: selectedQuestion.id,
            convertedToFAQ: true
          })
        });

        showToast("FAQ created successfully!", "success");
        setShowConvertModal(false);
        setSelectedQuestion(null);
        setFaqFormData({ question: "", answer: "", category: "general", keywords: "" });
        // Refresh analytics to update counts
        fetchAnalytics();
      } else {
        showToast(data.error || "Failed to create FAQ", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to create FAQ", "error");
    } finally {
      setConvertLoading(false);
    }
  };

  const handleDismissQuery = async (questionId) => {
    if (!questionId) return;

    setDismissingId(questionId);

    try {
      const response = await fetch("/api/chat/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: questionId,
          dismissed: true
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast("Query dismissed successfully", "success");
        setDismissTarget(null);
        fetchAnalytics();
      } else {
        showToast(data.error || "Failed to dismiss query", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to dismiss query", "error");
    } finally {
      setDismissingId(null);
    }
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "borrowing", label: "Borrowing" },
    { value: "hours", label: "Hours" },
    { value: "facilities", label: "Facilities" },
    { value: "policies", label: "Policies" },
    { value: "billing", label: "Billing" },
    { value: "support", label: "Support" }
  ];

  const isDismissingCurrent = dismissTarget ? dismissingId === dismissTarget.id : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-8">
      {/* Transaction Trends Chart */}
      <section>
        <AdminTransactionChart data={analytics?.transactionTrends || []} />
      </section>

      {/* FAQ & Support Overview - Second Row */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">FAQ & Support Overview</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Searches Card */}
          <div className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all ${
            newDataIndicator.searches ? 'border-emerald-400 shadow-emerald-100' : 'border-zinc-200'
          }`}>
            {newDataIndicator.searches && (
              <div className="absolute -top-2 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500"></span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-600">Total Searches</span>
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900">{analytics.totalSearches.toLocaleString()}</div>
            <p className="text-sm text-emerald-600 mt-2">
              +{analytics.recentSearches} in last 24h
            </p>
          </div>

          {/* FAQs Added Card */}
          <div className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all ${
            newDataIndicator.faqs ? 'border-blue-400 shadow-blue-100' : 'border-zinc-200'
          }`}>
            {newDataIndicator.faqs && (
              <div className="absolute -top-2 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500"></span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-600">FAQs Added</span>
              <HelpCircle className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900">{analytics.totalFAQs}</div>
            <p className="text-sm text-blue-600 mt-2">
              +{analytics.recentFAQs} in last 7 days
            </p>
          </div>

          {/* Unanswered Queries Card */}
          <div className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all ${
            newDataIndicator.unanswered ? 'border-amber-400 shadow-amber-100' : 'border-zinc-200'
          }`}>
            {newDataIndicator.unanswered && (
              <div className="absolute -top-2 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500"></span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-600">Unanswered Queries</span>
              <AlertTriangle className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900">{analytics.unansweredCount}</div>
            <p className="text-sm text-amber-600 mt-2">
              Needs attention
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unanswered Questions */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Unanswered Questions</h2>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">Recent Queries</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQueriesPage(prev => Math.max(1, prev - 1))}
                  disabled={!analytics.unansweredPagination || queriesPage === 1}
                  className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setQueriesPage(prev => Math.min(analytics.unansweredPagination?.totalPages || 1, prev + 1))}
                  disabled={!analytics.unansweredPagination || queriesPage === analytics.unansweredPagination.totalPages}
                  className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-zinc-100 h-[440px] overflow-y-auto">
              {analytics.unansweredQuestions.length > 0 ? (
                analytics.unansweredQuestions.map((question) => (
                  <div key={question.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900">
                            {question.question}
                          </p>
                          {question.askedCount > 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              ×{question.askedCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleConvertToFAQ(question)}
                          className="px-3 py-1 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          Convert to FAQ
                        </button>
                        <button
                          onClick={() => setDismissTarget(question)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dismiss query"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>Last asked {new Date(question.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{question.user}</span>
                      {question.askedCount > 1 && question.firstAsked && (
                        <>
                          <span>•</span>
                          <span>First asked {new Date(question.firstAsked).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 h-full flex flex-col items-center justify-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
                  <p>No unanswered questions</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl flex items-center justify-center">
              <span className="text-xs text-zinc-500">
                {analytics.unansweredPagination && analytics.unansweredPagination.totalItems > 0
                  ? `Showing ${((analytics.unansweredPagination.currentPage - 1) * analytics.unansweredPagination.pageSize) + 1}-${Math.min(analytics.unansweredPagination.currentPage * analytics.unansweredPagination.pageSize, analytics.unansweredPagination.totalItems)} of ${analytics.unansweredPagination.totalItems} total`
                  : "Showing 0 of 0 total"}
              </span>
            </div>
          </div>
        </section>

        {/* User Feedback */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">User Feedback</h2>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">FAQ Feedback Logs</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFeedbackPage(prev => Math.max(1, prev - 1))}
                  disabled={!analytics.feedbackPagination || feedbackPage === 1}
                  className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setFeedbackPage(prev => Math.min(analytics.feedbackPagination?.totalPages || 1, prev + 1))}
                  disabled={!analytics.feedbackPagination || feedbackPage === analytics.feedbackPagination.totalPages}
                  className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-zinc-100 h-[440px] overflow-y-auto">
              {analytics.faqFeedback.length > 0 ? (
                analytics.faqFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 mb-1">
                          {feedback.question}
                        </p>
                        <p className="text-xs text-zinc-500">
                          by {feedback.userName || "Anonymous"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {feedback.feedback === "helpful" ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Helpful</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-700">
                            <ThumbsDown className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Not Helpful</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                        {feedback.category}
                      </span>
                      <span>•</span>
                      <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 h-full flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
                  <p>No feedback yet</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl flex items-center justify-center">
              <span className="text-xs text-zinc-500">
                {analytics.feedbackPagination && analytics.feedbackPagination.totalItems > 0
                  ? `Showing ${((analytics.feedbackPagination.currentPage - 1) * analytics.feedbackPagination.pageSize) + 1}-${Math.min(analytics.feedbackPagination.currentPage * analytics.feedbackPagination.pageSize, analytics.feedbackPagination.totalItems)} of ${analytics.feedbackPagination.totalItems} total`
                  : "Showing 0 of 0 total"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>

    {/* Convert to FAQ Modal */}
    <ConfirmDialog
      open={Boolean(dismissTarget)}
      title="Dismiss Query"
      description={dismissTarget ? "Are you sure you want to dismiss this query? It will be removed from the list." : ""}
      confirmLabel={isDismissingCurrent ? "Dismissing..." : "Dismiss"}
      cancelLabel="Cancel"
      destructive
      loading={isDismissingCurrent}
      onCancel={() => {
        if (!isDismissingCurrent) setDismissTarget(null);
      }}
      onConfirm={() => {
        if (dismissTarget && !isDismissingCurrent) {
          void handleDismissQuery(dismissTarget.id);
        }
      }}
    />

    {showConvertModal && selectedQuestion && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-zinc-900">
              Convert Question to FAQ
            </h2>
            <button
              onClick={() => {
                setShowConvertModal(false);
                setSelectedQuestion(null);
                setFaqFormData({ question: "", answer: "", category: "general", keywords: "" });
              }}
              className="p-2 hover:bg-zinc-100 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmitFAQ} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Question
              </label>
              <input
                type="text"
                value={faqFormData.question}
                onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Enter FAQ question"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Answer
              </label>
              <textarea
                value={faqFormData.answer}
                onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[120px]"
                placeholder="Enter FAQ answer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Category
              </label>
              <select
                value={faqFormData.category}
                onChange={(e) => setFaqFormData({ ...faqFormData, category: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={faqFormData.keywords}
                onChange={(e) => setFaqFormData({ ...faqFormData, keywords: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="e.g., library, hours, borrowing"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={convertLoading}
                className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                {convertLoading ? "Creating..." : "Create FAQ"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedQuestion(null);
                  setFaqFormData({ question: "", answer: "", category: "general", keywords: "" });
                }}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
