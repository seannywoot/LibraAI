"use client";

import { useEffect, useRef } from "react";
import { X, Download } from "@/components/icons";

export default function PDFPreviewModal({ isOpen, onClose, pdfBlob, fileName }) {
  const iframeRef = useRef(null);
  const pdfUrlRef = useRef(null);

  useEffect(() => {
    if (isOpen && pdfBlob && iframeRef.current) {
      // Clean up previous URL
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      // Create new blob URL
      pdfUrlRef.current = URL.createObjectURL(pdfBlob);
      iframeRef.current.src = pdfUrlRef.current;
    }

    // Cleanup on unmount or close
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [isOpen, pdfBlob]);

  const handleDownload = () => {
    if (pdfUrlRef.current) {
      const link = document.createElement("a");
      link.href = pdfUrlRef.current;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">PDF Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
