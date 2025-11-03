"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "quagga";

export default function BarcodeScanner({ mode = "barcode", onDetected, onError }) {
  const scannerRef = useRef(null);
  const [detectedCode, setDetectedCode] = useState("");
  const [status, setStatus] = useState("initializing");

  useEffect(() => {
    if (mode !== "barcode" || !scannerRef.current) {
      return;
    }

    let mounted = true;

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment",
          },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader",
          ],
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 4,
        frequency: 10,
      },
      (err) => {
        if (!mounted) return;
        
        if (err) {
          console.error("Barcode scanner init error:", err);
          onError?.("Failed to initialize camera");
          setStatus("error");
          return;
        }
        Quagga.start();
        setStatus("scanning");
      }
    );

    const handleDetected = (result) => {
      if (!mounted) return;
      
      if (result?.codeResult?.code) {
        const code = result.codeResult.code;
        setDetectedCode(code);
        
        // Validate ISBN format (10 or 13 digits)
        if (/^\d{10}(\d{3})?$/.test(code)) {
          Quagga.stop();
          setStatus("detected");
          onDetected?.(code);
        }
      }
    };

    Quagga.onDetected(handleDetected);

    return () => {
      mounted = false;
      Quagga.stop();
      Quagga.offDetected(handleDetected);
    };
  }, [mode, onDetected, onError]);

  if (mode === "ocr") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            OCR mode: Upload an image using the &quot;Upload Image&quot; button to extract ISBN from book covers or pages.
          </p>
          <div className="text-xs text-gray-500">
            Supported formats: JPG, PNG, HEIC
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={scannerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      >
        {status === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <p>Failed to initialize camera</p>
            </div>
          </div>
        )}
      </div>

      {detectedCode && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-900">
            Detected: {detectedCode}
          </p>
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Hold the barcode steady within the camera view</li>
          <li>Ensure good lighting on the barcode</li>
          <li>Keep the barcode flat and avoid glare</li>
          <li>Position the barcode 6-8 inches from the camera</li>
        </ul>
      </div>
    </div>
  );
}
