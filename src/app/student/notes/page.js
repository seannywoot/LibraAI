"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Plus, FileText, Search, Trash2, Edit } from "@/components/icons";
import { generateNotePDF } from "@/utils/pdfExport";
import PDFPreviewModal from "@/components/pdf-preview-modal";
import { showToast } from "@/components/ToastContainer";
import ToastContainer from "@/components/ToastContainer";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [pdfPreview, setPdfPreview] = useState({ isOpen: false, blob: null, fileName: "" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const navigationLinks = getStudentLinks();

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/notes", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setLoading(false);
    }
  }

  async function createNewNote() {
    try {
      const res = await fetch("/api/student/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled",
          content: "",
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        router.push(`/student/notes/${data.note._id}`);
      }
    } catch (e) {
      console.error("Failed to create note:", e);
    }
  }

  function openDeleteModal(note, e) {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  }

  function cancelDelete() {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  }

  async function confirmDelete() {
    if (noteToDelete) {
      try {
        const res = await fetch(`/api/student/notes/${noteToDelete._id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setNotes(notes.filter((n) => n._id !== noteToDelete._id));
          showToast("Note deleted successfully", "success", 3000);
        } else {
          showToast("Failed to delete note", "error", 3000);
        }
      } catch (e) {
        console.error("Failed to delete note:", e);
        showToast("Failed to delete note", "error", 3000);
      }
    }
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const paginatedNotes = filteredNotes.slice((page - 1) * pageSize, page * pageSize);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getPreview(content) {
    if (!content) return "";
    const temp = document.createElement("div");
    temp.innerHTML = content;

    // Convert headings to divs to maintain formatting but avoid large text and prose-p conflicts
    const headings = temp.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach(heading => {
      const div = document.createElement("div");
      div.innerHTML = heading.innerHTML;
      div.className = "font-bold mb-1 mt-2"; // Keep it bold but normal size, add spacing
      heading.parentNode.replaceChild(div, heading);
    });

    // Remove empty paragraphs
    const paragraphs = temp.querySelectorAll("p");
    paragraphs.forEach(p => {
      if (!p.textContent.trim() && !p.querySelector("img")) {
        p.remove();
      }
    });

    return temp.innerHTML;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-16 pb-8 lg:p-8 min-[1440px]:pl-[300px] min-[1440px]:pt-4">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-6">
        <header>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                NOTES
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-1">My Notes</h1>
              <p className="text-sm text-gray-600 mt-2">
                Create, organize, and manage your personal notes with our rich text editor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={createNewNote}
                className="flex items-center gap-2 px-4 py-2 bg-(--btn-primary) text-white rounded-lg hover:bg-(--btn-primary-hover) transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Note
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading notes...</div>
        ) : paginatedNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-full bg-gray-100 p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first note to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={createNewNote}
                className="inline-flex items-center gap-2 px-4 py-2 bg-(--btn-primary) text-white rounded-lg hover:bg-(--btn-primary-hover) transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  searchQuery={searchQuery}
                  openDeleteModal={openDeleteModal}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {filteredNotes.length > pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredNotes.length)} of {filteredNotes.length} notes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#C86F26] hover:bg-[#C86F26] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#C86F26] hover:bg-[#C86F26] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview({ isOpen: false, blob: null, fileName: "" })}
        pdfBlob={pdfPreview.blob}
        fileName={pdfPreview.fileName}
      />

      {/* Toast Container */}
      <ToastContainer />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Note?
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Are you sure you want to delete this note?
              </p>
              {noteToDelete && (
                <p className="text-sm font-medium text-gray-900 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {noteToDelete.title || "Untitled"}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-3">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPreview(content) {
  if (!content) return "";
  const temp = document.createElement("div");
  temp.innerHTML = content;

  // Convert headings to divs to maintain formatting but avoid large text and prose-p conflicts
  const headings = temp.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach(heading => {
    const div = document.createElement("div");
    div.innerHTML = heading.innerHTML;
    div.className = "font-bold mb-1"; // Keep it bold but normal size, remove top spacing
    heading.parentNode.replaceChild(div, heading);
  });

  // Remove empty paragraphs
  const paragraphs = temp.querySelectorAll("p");
  paragraphs.forEach(p => {
    if (!p.textContent.trim() && !p.querySelector("img")) {
      p.remove();
    }
  });

  return temp.innerHTML;
}

function NoteCard({ note, searchQuery, openDeleteModal, formatDate }) {
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [note.content]);

  return (
    <Link
      href={`/student/notes/${note._id}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-5 hover:shadow-[0_8px_20px_rgba(200,111,38,0.3)] transition-all min-h-[200px]"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
          {note.title || "Untitled"}
        </h3>
        <button
          onClick={(e) => openDeleteModal(note, e)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
          title="Delete note"
        >
          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
        </button>
      </div>

      {note.content && (
        <div className="relative mb-3 max-h-18 overflow-hidden">
          <div
            ref={contentRef}
            className="text-sm text-gray-600 leading-6 prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: getPreview(note.content) }}
          />
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
        <span>Updated {formatDate(note.updatedAt)}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
