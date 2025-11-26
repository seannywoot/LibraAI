"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "quagga";

export default function BarcodeScanner({ onDetected, onError }) {
  const scannerRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const onErrorRef = useRef(onError);
  const [detectedCode, setDetectedCode] = useState("");
  const [status, setStatus] = useState("initializing"); // initializing, scanning, detected, error, timeout
  const timeoutRef = useRef(null);
  const SCAN_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

  // Keep refs updated
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onErrorRef.current = onError;
  }, [onDetected, onError]);

  const startScanner = () => {
    if (!scannerRef.current) return;

    console.log("Initializing Quagga barcode scanner...");
    setStatus("initializing");
    setDetectedCode("");

    // Clear any existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let mounted = true;
    let hasDetected = false;

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 1280,
            height: 720,
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 },
          },
          area: { // defines rectangle of the detection/localization area
            top: "25%",    // top offset
            right: "10%",  // right offset
            left: "10%",   // left offset
            bottom: "25%"  // bottom offset
          },
        },
        decoder: {
          readers: [
            "ean_reader", // ISBN-13
            "upc_reader", // UPC-A
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
          if (onErrorRef.current) {
            onErrorRef.current("Failed to initialize camera");
          }
          setStatus("error");
          return;
        }
        console.log("Quagga initialized successfully, starting scanner...");
        Quagga.start();
        setStatus("scanning");
        console.log("Scanner status set to: scanning");

        // Start timeout timer
        timeoutRef.current = setTimeout(() => {
          if (mounted && !hasDetected) {
            console.log("Scan timed out");
            Quagga.stop();
            setStatus("timeout");
          }
        }, SCAN_TIMEOUT_MS);
      }
    );

    // Visual feedback for detection
    Quagga.onProcessed((result) => {
      const drawingCtx = Quagga.canvas.ctx.overlay;
      const drawingCanvas = Quagga.canvas.dom.overlay;

      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(
            0,
            0,
            parseInt(drawingCanvas.getAttribute("width")),
            parseInt(drawingCanvas.getAttribute("height"))
          );
          result.boxes.filter((box) => box !== result.box).forEach((box) => {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "green",
              lineWidth: 2,
            });
          });
        }

        if (result.box) {
          Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
            color: "#00F",
            lineWidth: 2,
          });
        }

        if (result.codeResult && result.codeResult.code) {
          Quagga.ImageDebug.drawPath(
            result.line,
            { x: "x", y: "y" },
            drawingCtx,
            { color: "red", lineWidth: 3 }
          );
        }
      }
    });

    const handleDetected = (result) => {
      if (!mounted) {
        console.log("Component unmounted, ignoring detection");
        return;
      }

      if (hasDetected) {
        console.log("Already detected a code, ignoring");
        return;
      }

      if (result?.codeResult?.code) {
        const code = result.codeResult.code;
        console.log("Barcode detected:", code, "Format:", result.codeResult.format);

        // Validate ISBN format (10 or 13 digits)
        if (/^\d{10}(\d{3})?$/.test(code)) {
          hasDetected = true;
          setDetectedCode(code);
          Quagga.stop();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setStatus("detected");

          console.log("Valid ISBN detected, calling onDetected callback");

          if (onDetectedRef.current) {
            onDetectedRef.current(code);
          }
        } else {
          console.log("Invalid ISBN format, continuing to scan...");
        }
      }
    };

    Quagga.onDetected(handleDetected);

    return () => {
      mounted = false;
      Quagga.stop();
      Quagga.offDetected(handleDetected);
      Quagga.offProcessed(); // Clean up processed listener
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  };

  useEffect(() => {
    const cleanup = startScanner();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    startScanner();
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={scannerRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-cover" />

        {/* Visual Guide Overlay */}
        {status === "scanning" && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-[80%] h-[50%] border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 -mt-0.5 -ml-0.5"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500 -mt-0.5 -mr-0.5"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 -mb-0.5 -ml-0.5"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 -mb-0.5 -mr-0.5"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-red-500/50"></div>
              </div>
            </div>
            <p className="absolute bottom-4 text-white/80 text-xs bg-black/50 px-2 py-1 rounded">
              Place barcode within the box
            </p>
          </div>
        )}

        {status === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black">
            <div className="text-center">
              <p>Failed to initialize camera</p>
              <p className="text-xs mt-2">Please allow camera access</p>
            </div>
          </div>
        )}
        {status === "timeout" && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black/80">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Scan timed out</p>
              <p className="text-sm text-gray-300 mb-4">No barcode detected within 3 minutes.</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Retry Scan
              </button>
            </div>
          </div>
        )}
        {status === "scanning" && (
          <div className="absolute top-2 left-2 z-30 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Scanning...
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
          <li>Hold the barcode steady within the box</li>
          <li>Ensure good lighting on the barcode</li>
          <li>Keep the barcode flat and avoid glare</li>
          <li>Make sure that the barcode is clear and not faded or damaged.</li>
        </ul>
      </div>
    </div>
  );
}
