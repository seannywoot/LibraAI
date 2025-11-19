"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import NotionEditor from "@/components/notion-editor";
import { ArrowLeft, Trash2, Download } from "@/components/icons";
import { generateNotePDF } from "@/utils/pdfExport";
import PDFPreviewModal from "@/components/pdf-preview-modal";

export default function NoteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.noteId;
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfPreview, setPdfPreview] = useState({ isOpen: false, blob: null, fileName: "" });
  const saveTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);
  const savingRef = useRef(false);
  const navigationLinks = getStudentLinks();

  useEffect(() => {
    if (noteId && !isLoadingRef.current) {
      loadNote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  async function loadNote() {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/notes/${noteId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setNote(data.note);
        setTitle(data.note.title || "");
        setContent(data.note.content || "");
      } else {
        router.push("/student/notes");
      }
    } catch (e) {
      console.error("Failed to load note:", e);
      router.push("/student/notes");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }

  async function saveNote(newTitle, newContent) {
    if (savingRef.current) return; // Prevent concurrent saves
    if (!noteId) {
      console.error("Cannot save: noteId is missing");
      return;
    }
    
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`/api/student/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setNote(data.note);
      } else {
        console.error("Failed to save note:", {
          error: data.error,
          noteId,
          status: res.status,
        });
      }
    } catch (e) {
      console.error("Failed to save note:", e);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  function handleTitleChange(e) {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, content);
  }

  function handleContentChange(newContent) {
    if (newContent !== content) {
      setContent(newContent);
      debouncedSave(title, newContent);
    }
  }

  function debouncedSave(newTitle, newContent) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if note is loaded and not currently loading
      if (!isLoadingRef.current && note) {
        saveNote(newTitle, newContent);
      }
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  async function deleteNote() {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/student/notes/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/student/notes");
      }
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  }

  async function handleExportPDF() {
    try {
      const { blob, fileName } = await generateNotePDF({ ...note, title, content });
      setPdfPreview({ isOpen: true, blob, fileName });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
        <DashboardSidebar
          heading="LibraAI"
          links={navigationLinks}
          variant="light"
          SignOutComponent={SignOutButton}
        />
        <div className="text-center py-12 text-gray-600">Loading note...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pr-6 pl-[300px]">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/student/notes")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </button>

          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
            {!saving && note && (
              <span className="text-sm text-gray-500">
                Saved {new Date(note.updatedAt).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleExportPDF}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Export to PDF"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={deleteNote}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:outline-none"
          />

          <NotionEditor
            content={content}
            onChange={handleContentChange}
          />
        </div>
      </main>

      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview({ isOpen: false, blob: null, fileName: "" })}
        pdfBlob={pdfPreview.blob}
        fileName={pdfPreview.fileName}
      />
    </div>
  );
}
