"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from "@/components/icons";

export default function NotionEditor({ content, onChange }) {
  const editorRef = useRef(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML;
      if (content !== currentContent) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const cursorOffset = range ? range.startOffset : 0;
        const cursorNode = range ? range.startContainer : null;

        editorRef.current.innerHTML = content || '<p><br></p>';

        // Restore cursor position if possible
        if (cursorNode && editorRef.current.contains(cursorNode)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(cursorNode, Math.min(cursorOffset, cursorNode.length || 0));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            // Cursor restoration failed, just focus the editor
            editorRef.current.focus();
          }
        }
      }
    }
  }, [content]);

  function handleInput() {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }

  function handleKeyDown(e) {
    // Handle slash commands
    if (e.key === "/") {
      setShowToolbar(true);
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
      }
    }
  }

  function execCommand(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  function insertBlock(type) {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    
    // Get selected text
    const selectedText = range.toString();
    
    let element;
    switch (type) {
      case "h1":
        element = document.createElement("h1");
        element.className = "text-3xl font-bold text-gray-900 mb-4";
        element.textContent = selectedText || "Heading 1";
        break;
      case "h2":
        element = document.createElement("h2");
        element.className = "text-2xl font-bold text-gray-900 mb-3";
        element.textContent = selectedText || "Heading 2";
        break;
      case "h3":
        element = document.createElement("h3");
        element.className = "text-xl font-bold text-gray-900 mb-2";
        element.textContent = selectedText || "Heading 3";
        break;
      case "ul":
        execCommand("insertUnorderedList");
        return;
      case "ol":
        execCommand("insertOrderedList");
        return;
      case "quote":
        element = document.createElement("blockquote");
        element.className = "border-l-4 border-gray-300 pl-4 py-2 my-4 text-gray-700 italic";
        element.textContent = selectedText || "Quote";
        break;
      case "code":
        element = document.createElement("pre");
        element.className = "bg-gray-100 rounded-lg p-4 my-4 overflow-x-auto";
        const code = document.createElement("code");
        code.textContent = selectedText || "// Code block";
        element.appendChild(code);
        break;
      default:
        return;
    }

    range.deleteContents();
    range.insertNode(element);
    
    // Place cursor at the end of the inserted element
    range.setStartAfter(element);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    handleInput();
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 mb-4 flex items-center gap-1 flex-wrap">
        <button
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => execCommand("underline")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4 text-gray-700" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => insertBlock("h1")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => insertBlock("h2")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => insertBlock("h3")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4 text-gray-700" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => insertBlock("ul")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => insertBlock("ol")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4 text-gray-700" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => insertBlock("quote")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Quote"
        >
          <Quote className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={() => insertBlock("code")}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Code Block"
        >
          <Code className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleInput}
        className="min-h-[500px] text-gray-900 focus:outline-none prose prose-lg max-w-none p-4"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
        suppressContentEditableWarning
        data-placeholder="Start typing..."
      />

      <style jsx global>{`
        [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        [contenteditable]:focus {
          outline: none;
        }
        
        [contenteditable] h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #111827;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        
        [contenteditable] p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        [contenteditable] li {
          margin-bottom: 0.5rem;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin: 1rem 0;
          color: #374151;
          font-style: italic;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        [contenteditable] code {
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
