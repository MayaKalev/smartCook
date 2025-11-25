import React, { useState } from "react";
import ScanModal from "../components/inventory/ScanModal";
import { useNavigate } from "react-router-dom";

export default function ScanProduct() {
  const [showModal, setShowModal] = useState(false);
  const [product, setProduct] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProductFromServer = async (barcode) => {
    try {
      const res = await fetch(`http://localhost:5000/api/barcode/product/${barcode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setProduct(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBarcodeDetected = async (barcodeOrBase64) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setScannedBarcode(barcodeOrBase64);

    try {
      // Direct barcode
      if (/^\d{8,14}$/.test(barcodeOrBase64)) {
        await fetchProductFromServer(barcodeOrBase64);
        return;
      }

      // Base64 image barcode
      const scanRes = await fetch("http://localhost:5000/api/scan/base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: barcodeOrBase64 }),
      });

      const scanData = await scanRes.json();
      if (!scanRes.ok) throw new Error(scanData.error || "Barcode not recognized");

      const barcode = scanData.barcode;
      setScannedBarcode(barcode);
      await fetchProductFromServer(barcode);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-center">📦 Scan Product by Barcode</h1>

      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        📷 Start Scanning
      </button>

      <ScanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDetected={handleBarcodeDetected}
      />

      {loading && <p className="text-center text-gray-500">🔄 Loading product info...</p>}
      {error && error !== "Product not found" && (
        <p className="text-center text-red-500">{error}</p>
      )}

      {/* ✅ Product found */}
      {product && (
        <div className="border p-4 rounded shadow bg-white">
          <h2 className="text-lg font-bold mb-2">Product found:</h2>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Barcode:</strong> {product.barcode}</p>

          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="mt-2 w-40 rounded border"
            />
          )}

          <button
            onClick={() =>
              navigate("/inventory/add", {
                state: { name: product.name }
              })
            }
            className="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            ➕ Add to Inventory
          </button>
        </div>
      )}

      {/* ❗ Not found → redirect to manual add */}
      {error === "Product not found" && (
        <div className="border p-4 rounded bg-yellow-50">
          <h2 className="font-bold mb-2">Couldn't find this product.</h2>
          <button
            onClick={() =>
              navigate("/inventory/add", {
                state: { name: product.name, barcode: product.barcode }
              })
            }
            className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
          >
            ➕ Add it Manually
          </button>
        </div>
      )}
    </div>
  );
}
