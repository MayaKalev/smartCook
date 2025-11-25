import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AddIngredientForm from "./AddIngredientForm";

export default function InventoryAddPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const nameFromScan = location.state?.name || "";
  const barcodeFromScan = location.state?.barcode || "";

  const handleSubmit = async (ingredient) => {
    const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
    const userId = storedUser.user_id || storedUser.id || 1;

    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ingredient, barcode: barcodeFromScan, user_id: userId })
      });

      if (!res.ok) throw new Error("Failed to add product");
      navigate("/inventory");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">➕ Add Product to Inventory</h1>
      <AddIngredientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/inventory")}
        prefillName={nameFromScan}
      />
    </div>
  );
}
