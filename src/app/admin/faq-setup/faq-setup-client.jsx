"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Plus, Edit2, Trash2, X } from "lucide-react";

export default function FAQSetupClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    keywords: ""
  });

  const navigationLinks = getAdminLinks();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch("/api/faq");
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
    }
  };

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
        fetchFAQs();
      } else {
        setError(data.error || "Failed to seed FAQs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean)
        })
      });
      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        setFormData({ question: "", answer: "", category: "general", keywords: "" });
        fetchFAQs();
      } else {
        setError(data.error || "Failed to add FAQ");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFAQ = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/faq/${editingFaq._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean)
        })
      });
      const data = await response.json();

      if (data.success) {
        setEditingFaq(null);
        setFormData({ question: "", answer: "", category: "general", keywords: "" });
        fetchFAQs();
      } else {
        setError(data.error || "Failed to update FAQ");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const response = await fetch(`/api/faq/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.success) {
        fetchFAQs();
      } else {
        setError(data.error || "Failed to delete FAQ");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: Array.isArray(faq.keywords) ? faq.keywords.join(", ") : ""
    });
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

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-800 mb-2">
              FAQ Management
            </h1>
            <p className="text-zinc-600">
              Manage FAQ database and add new questions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition"
          >
            <Plus className="h-4 w-4" />
            Add New FAQ
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Seed Database Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              Seed FAQ Database
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              Populate with 11 default FAQs across 4 categories
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-xs text-amber-800">
                ⚠️ This will delete all existing FAQs
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full px-4 py-2 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              {loading ? "Seeding..." : "Seed Database"}
            </button>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">
              FAQ Statistics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Total FAQs</span>
                <span className="text-2xl font-bold text-zinc-900">{faqs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Categories</span>
                <span className="text-2xl font-bold text-zinc-900">
                  {new Set(faqs.map(f => f.category)).size}
                </span>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-800">
              ✅ {result.message} - {result.count} FAQs added
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Existing FAQs */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-800">Existing FAQs</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <div key={faq._id} className="p-6 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-700">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-zinc-600 mb-2">{faq.answer}</p>
                      {faq.keywords && faq.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {faq.keywords.map((keyword, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(faq)}
                        className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq._id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500">
                <p>No FAQs found. Click &quot;Add New FAQ&quot; or &quot;Seed Database&quot; to get started.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingFaq) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-zinc-900">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFaq(null);
                  setFormData({ question: "", answer: "", category: "general", keywords: "" });
                }}
                className="p-2 hover:bg-zinc-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={editingFaq ? handleUpdateFAQ : handleAddFAQ} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
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
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g., library, hours, borrowing"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 transition"
                >
                  {loading ? "Saving..." : editingFaq ? "Update FAQ" : "Add FAQ"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingFaq(null);
                    setFormData({ question: "", answer: "", category: "general", keywords: "" });
                  }}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
