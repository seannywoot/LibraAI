"use client";

import { useState, useEffect } from "react";
import { Search, HelpCircle, AlertTriangle, TrendingUp, Plus, FileText, ThumbsUp, ThumbsDown } from "lucide-react";

export default function DashboardClient() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDataIndicator, setNewDataIndicator] = useState({});

  useEffect(() => {
    fetchAnalytics();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async (isUpdate = false) => {
    try {
      const response = await fetch("/api/admin/analytics");
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

  const handleConvertToFAQ = async (questionId) => {
    // This would open a modal or navigate to FAQ creation with pre-filled data
    console.log("Convert question to FAQ:", questionId);
  };

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
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">Dashboard Overview</h2>
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

      {/* Most Searched Keywords */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">Most Searched Keywords</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {analytics.topKeywords.length > 0 ? (
            <div className="space-y-3">
              {analytics.topKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-700">
                      {index + 1}
                    </span>
                    <span className="font-medium text-zinc-900">{keyword.keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-zinc-100" style={{ width: `${Math.max(60, keyword.count * 10)}px` }}>
                      <div 
                        className="h-2 rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${(keyword.count / analytics.topKeywords[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-600 w-12 text-right">{keyword.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-8">No search data available yet</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unanswered Questions */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Unanswered Questions</h2>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl">
              <h3 className="text-sm font-semibold text-zinc-700">Recent Queries</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {analytics.unansweredQuestions.length > 0 ? (
                analytics.unansweredQuestions.map((question) => (
                  <div key={question.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-zinc-900 flex-1">
                        {question.question}
                      </p>
                      <button
                        onClick={() => handleConvertToFAQ(question.id)}
                        className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        Convert to FAQ
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>Asked {new Date(question.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{question.user}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
                  <p>No unanswered questions</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* User Feedback */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">User Feedback</h2>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl">
              <h3 className="text-sm font-semibold text-zinc-700">FAQ Feedback Logs</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {analytics.faqFeedback.length > 0 ? (
                analytics.faqFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-zinc-900 flex-1">
                        {feedback.question}
                      </p>
                      {feedback.feedback === "helpful" ? (
                        <ThumbsUp className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                        {feedback.category}
                      </span>
                      <span>•</span>
                      <span>{new Date(feedback.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
                  <p>No feedback yet</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* FAQ Management */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">FAQ Management</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="text-base font-semibold text-zinc-900 mb-3">Add New FAQ</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Create a new FAQ entry to help users find answers quickly
            </p>
            <a
              href="/admin/faq-setup"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add FAQ
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="text-base font-semibold text-zinc-900 mb-3">Existing FAQs</h3>
            <p className="text-sm text-zinc-600 mb-4">
              View and manage all FAQ entries in the database
            </p>
            <a
              href="/admin/faq-setup"
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-900 text-zinc-900 rounded-xl font-medium hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4" />
              Manage FAQs
            </a>
          </div>
        </div>
      </section>

      {/* Auto-refresh indicator */}
      <div className="text-center">
        <p className="text-xs text-zinc-400">
          Dashboard updates automatically every 30 seconds
        </p>
      </div>
    </div>
  );
}
