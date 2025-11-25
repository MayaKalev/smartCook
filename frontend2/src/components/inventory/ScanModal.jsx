import React from "react";
import { X } from "lucide-react";
import BarcodeScannerWrapper from "../scanner/BarcodeScannerWrapper";

export default function ScanModal({ isOpen, onClose, onDetected }) {
  if (!isOpen) return null;

  const handleResult = (barcode) => {
    if (onDetected) onDetected(barcode);
    onClose(); // סגור את המודאל לאחר קליטה
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        {/* כפתור סגירה */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* כותרת */}
        <h2 className="text-lg font-bold text-center mb-4">
          📦 סריקת ברקוד
        </h2>

        {/* אזור סריקה */}
        <BarcodeScannerWrapper onResult={handleResult} />
      </div>
    </div>
  );
}
