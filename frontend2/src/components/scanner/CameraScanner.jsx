import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef(null); // שמירה על אובייקט השליטה
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    console.log("📦 useEffect - Starting scanner");
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setScanning(true);

    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) {
        throw new Error("No camera devices found.");
      }

      const selectedDeviceId = devices[0].deviceId;

      controlsRef.current = await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("📸 Barcode detected:", result.getText());
            stopScanner();
            if (onDetected) {
              onDetected(result.getText());
            }
          }

          if (err && !(err.name === "NotFoundException")) {
            console.error("❌ Scan error:", err);
            setError("An error occurred while scanning.");
          }
        }
      );
    } catch (err) {
      console.error("❌ Scanner failed to start:", err);
      setError(err.message || "Unexpected error");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    try {
      if (controlsRef.current && controlsRef.current.stop) {
        controlsRef.current.stop(); // הפסקת הסריקה
        controlsRef.current = null;
      }
      setScanning(false);
    } catch (err) {
      console.warn("⚠️ Error stopping scanner:", err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <video ref={videoRef} className="rounded shadow-md w-full max-w-md" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!scanning && (
        <button
          onClick={startScanner}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📷 Restart Scanner
        </button>
      )}
    </div>
  );
}
