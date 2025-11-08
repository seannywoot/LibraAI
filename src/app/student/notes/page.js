"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Plus, FileText, Search, Trash2, Edit } from "@/components/icons";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  async function deleteNote(noteId, e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/student/notes/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== noteId));
      }
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const text = content.replace(/<[^>]*>/g, "").trim();
    return text.substring(0, 150) + (text.length > 150 ? "..." : "");
  }

  return (
    <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                NOTES
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-1">My Notes</h1>
            </div>
            <button
              onClick={createNewNote}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Note
            </button>
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
        ) : filteredNotes.length === 0 ? (
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Link
                key={note._id}
                href={`/student/notes/${note._id}`}
                className="group block rounded-lg border border-gray-200 bg-white p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                    {note.title || "Untitled"}
                  </h3>
                  <button
                    onClick={(e) => deleteNote(note._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                  </button>
                </div>
                
                {note.content && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {getPreview(note.content)}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Updated {formatDate(note.updatedAt)}</span>
                  <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
