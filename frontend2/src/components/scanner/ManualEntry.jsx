import React, { useState } from "react";

export default function ManualEntry({ onDetected }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const cleaned = barcode.trim();

    if (!cleaned) {
      setError("אנא הזן ברקוד תקני");
      return;
    }

    // אפשר להוסיף ולידציה מתקדמת יותר כאן
    if (!/^\d{8,14}$/.test(cleaned)) {
      setError("ברקוד צריך להיות מספרי (8–14 ספרות)");
      return;
    }

    if (onDetected) onDetected(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="הזן את הברקוד ידנית"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
      >
        ➕ הוסף לפי ברקוד
      </button>
    </form>
  );
}
