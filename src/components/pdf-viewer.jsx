"use client";

import { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function PDFViewer({ fileUrl }) {
  const [error, setError] = useState(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (!fileUrl) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No PDF file available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden" style={{ height: "750px" }}>
      {error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-red-600">Failed to load PDF: {error}</p>
        </div>
      ) : (
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            onError={(err) => setError(err.message)}
          />
        </Worker>
      )}
    </div>
  );
}
