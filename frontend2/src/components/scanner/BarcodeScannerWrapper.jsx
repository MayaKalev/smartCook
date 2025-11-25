import React, { useState } from "react";
import CameraScanner from "./CameraScanner";
import UploadScanner from "./UploadScanner";
import ManualEntry from "./ManualEntry";

/**
 * מציג את שלוש אפשרויות הסריקה עם שליטה באמצעות כפתורים
 */
export default function BarcodeScannerWrapper({ onResult }) {
  const [mode, setMode] = useState("camera"); // "camera" | "upload" | "manual"
  const [detected, setDetected] = useState(null);

  const handleDetected = (barcode) => {
    console.log("🚀 ברקוד שהתקבל:", barcode);
    setDetected(barcode);
    if (onResult) onResult(barcode);
  };

  return (
    <div className="space-y-4">
      {/* כפתורי ניווט בין אפשרויות */}
      <div className="flex gap-2 justify-center">
        <button
          className={`px-4 py-2 rounded ${mode === "camera" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("camera")}
        >
          📷 מצלמה
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("upload")}
        >
          🖼 העלאת תמונה
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("manual")}
        >
          ⌨️ הקלדה ידנית
        </button>
      </div>

      {/* אזור התצוגה לפי מצב */}
      <div className="mt-4">
        {mode === "camera" && <CameraScanner onDetected={handleDetected} />}
        {mode === "upload" && <UploadScanner onDetected={handleDetected} />}
        {mode === "manual" && <ManualEntry onDetected={handleDetected} />}
      </div>

      {/* תוצאה אחרונה שנקלטה */}
      {detected && (
        <div className="text-center text-green-600 font-bold mt-4">
          ✅ ברקוד שנקלט: {detected}
        </div>
      )}
    </div>
  );
}
