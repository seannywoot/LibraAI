"use client";

import { useState, useEffect, useRef } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/confirm-dialog";
import UnsavedChangesDialog from "@/components/unsaved-changes-dialog";

export default function FAQSetupClient() {
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    keywords: ""
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);
  const initialFormDataRef = useRef(null);

  const navigationLinks = getAdminLinks();

  useEffect(() => {
    fetchFAQs();

    // Check if URL has #add hash to auto-open the add modal
    if (window.location.hash === "#add") {
      openAddModal();
      // Remove the hash from URL after opening modal
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch("/api/faq?includeInactive=true");
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs);
      } else {
        showToast("Failed to load FAQs", "error");
      }
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
      showToast("Failed to load FAQs", "error");
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        showToast("FAQ added successfully!", "success");
        setShowAddModal(false);
        setFormData({ question: "", answer: "", category: "general", keywords: "" });
        setHasUnsavedChanges(false);
        initialFormDataRef.current = null;
        fetchFAQs();
      } else {
        showToast(data.error || "Failed to add FAQ", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to add FAQ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFAQ = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        showToast("FAQ updated successfully!", "success");
        setEditingFaq(null);
        setFormData({ question: "", answer: "", category: "general", keywords: "" });
        setHasUnsavedChanges(false);
        initialFormDataRef.current = null;
        fetchFAQs();
      } else {
        showToast(data.error || "Failed to update FAQ", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update FAQ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (!id) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/faq/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.success) {
        showToast("FAQ deleted successfully!", "success");
        setPendingDelete(null);
        fetchFAQs();
      } else {
        showToast(data.error || "Failed to delete FAQ", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to delete FAQ", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    const newFormData = {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: Array.isArray(faq.keywords) ? faq.keywords.join(", ") : ""
    };
    setFormData(newFormData);
    initialFormDataRef.current = newFormData;
    setHasUnsavedChanges(false);
  };

  const openAddModal = () => {
    const newFormData = { question: "", answer: "", category: "general", keywords: "" };
    setFormData(newFormData);
    initialFormDataRef.current = newFormData;
    setShowAddModal(true);
    setHasUnsavedChanges(false);
  };

  const handleFormChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const closeModal = () => {
    if (hasUnsavedChanges) {
      setPendingCloseAction(() => () => {
        setShowAddModal(false);
        setEditingFaq(null);
        setFormData({ question: "", answer: "", category: "general", keywords: "" });
        setHasUnsavedChanges(false);
        initialFormDataRef.current = null;
      });
      setShowUnsavedDialog(true);
    } else {
      setShowAddModal(false);
      setEditingFaq(null);
      setFormData({ question: "", answer: "", category: "general", keywords: "" });
      initialFormDataRef.current = null;
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

  const isDeletingCurrent = pendingDelete ? deletingId === pendingDelete._id : false;

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 min-[1440px]:pl-[300px] text-(--text)">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
        onNavigate={(callback) => {
          if (hasUnsavedChanges) {
            setPendingCloseAction(() => callback);
            setShowUnsavedDialog(true);
            return false;
          }
          callback();
          return true;
        }}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">FAQ Management</h1>
              <p className="text-sm text-zinc-600">Manage FAQ database and add new questions.</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--btn-primary)] bg-[var(--btn-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--btn-primary-hover)]"
            >
              <Plus className="h-4 w-4" />
              Add New FAQ
            </button>
          </div>
        </header>

        {/* Existing FAQs */}
        <section className="space-y-4">
          <div className="divide-y divide-(--stroke)">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <div key={faq._id} className="py-6 first:pt-0 hover:bg-zinc-50 transition-colors -mx-4 px-4 rounded-xl">
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
                        onClick={() => setPendingDelete(faq)}
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
                <p>No FAQs found. Click "Add New FAQ" or "Seed Database" to get started.</p>
              </div>
            )}
          </div>
        </section>
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
                onClick={closeModal}
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
                  onChange={(e) => handleFormChange({ question: e.target.value })}
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
                  onChange={(e) => handleFormChange({ answer: e.target.value })}
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
                  onChange={(e) => handleFormChange({ category: e.target.value })}
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
                  onChange={(e) => handleFormChange({ keywords: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g., library, hours, borrowing"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[var(--btn-primary)] text-white rounded-xl font-medium hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 transition"
                >
                  {loading ? "Saving..." : editingFaq ? "Update FAQ" : "Add FAQ"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete FAQ"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.question}"? This cannot be undone.` : ""}
        confirmLabel={isDeletingCurrent ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        loading={isDeletingCurrent}
        onCancel={() => {
          if (!isDeletingCurrent) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          if (pendingDelete && !isDeletingCurrent) {
            void handleDeleteFAQ(pendingDelete._id);
          }
        }}
      />

      <UnsavedChangesDialog
        hasUnsavedChanges={hasUnsavedChanges}
        showDialog={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          if (pendingCloseAction) {
            pendingCloseAction();
            setPendingCloseAction(null);
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingCloseAction(null);
        }}
      />
    </div>
  );
}
