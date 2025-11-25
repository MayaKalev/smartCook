import React, { useState } from "react";

export default function UploadScanner({ onDetected }) {
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    // יצירת preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1]; // מסיר את data:image/jpeg;base64,...

      setPreview(reader.result);

      try {
        const res = await fetch("http://localhost:5000/api/scan/base64", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64String }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "שגיאה לא ידועה");

        if (!data.barcodes || data.barcodes.length === 0) {
          setError("לא נמצא ברקוד בתמונה.");
        } else {
          const barcode = data.barcodes[0].data;
          onDetected(barcode);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="text-center space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block mx-auto"
      />

      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-w-xs mx-auto" />
        </div>
      )}

      {loading && <p className="text-gray-500">🔍 סורק תמונה...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
