"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "quagga";

export default function BarcodeScanner({ onDetected, onError }) {
  const scannerRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const onErrorRef = useRef(onError);
  const [detectedCode, setDetectedCode] = useState("");
  const [status, setStatus] = useState("initializing");

  // Keep refs updated
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onErrorRef.current = onError;
  }, [onDetected, onError]);

  useEffect(() => {
    if (!scannerRef.current) {
      console.log("Scanner ref not ready");
      return;
    }

    console.log("Initializing Quagga barcode scanner...");
    let mounted = true;
    let hasDetected = false;

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
      }
    );

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
          setStatus("detected");
          
          console.log("Valid ISBN detected, calling onDetected callback");
          console.log("onDetectedRef.current exists:", !!onDetectedRef.current);
          
          if (onDetectedRef.current) {
            onDetectedRef.current(code);
          } else {
            console.error("onDetected callback is not defined!");
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
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        ref={scannerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      >
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
        {status === "scanning" && (
          <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
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
          <li>Hold the barcode steady within the camera view</li>
          <li>Ensure good lighting on the barcode</li>
          <li>Keep the barcode flat and avoid glare</li>
          <li>Position the barcode 6-8 inches from the camera</li>
        </ul>
      </div>
    </div>
  );
}
