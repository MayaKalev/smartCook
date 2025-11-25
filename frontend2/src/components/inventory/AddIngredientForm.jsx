import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddIngredientForm({ onSubmit, onCancel, existingItems = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { name = "", barcode = "" } = location.state || {};

  const [form, setForm] = useState({
    name,
    quantity: "",
    unit: "",
    expiration_date: "",
    barcode
  });

  const [allowedUnits, setAllowedUnits] = useState([]);
  const [expiryRequired, setExpiryRequired] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");


  const handleFetchUnits = async () => {
    const name = form.name.trim();
    if (!name) {
      setAllowedUnits([]);
      setIsVerified(false);
      setMessage("❌ Please enter a name");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/ingredient/units?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error("Failed to fetch allowed units");
      const data = await res.json();
      console.log("📦 classification received:", data.category);

      const units = data.units || [];
      const expiryRequiredFlag = data.expiry_required ?? true;
      const categoryReceived = data.category || "Uncategorized";


      if (units.length === 0) {
        setIsVerified(false);
        setMessage("❌ No units found for this ingredient");
        setAllowedUnits([]);
        setExpiryRequired(true);
        setCategory("");

      } else {
        setAllowedUnits(units);
        setExpiryRequired(expiryRequiredFlag);
        setCategory(categoryReceived); // 🆕
        setIsVerified(true);
        setMessage("✔ Units loaded successfully");
      }
    } catch (err) {
      console.error("❌ Error fetching units:", err);
      setIsVerified(false);
      setAllowedUnits([]);
      setExpiryRequired(true);
      setMessage("❌ Error fetching units");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      alert("Please verify the ingredient name first.");
      return;
    }

    if (!allowedUnits.includes(form.unit)) {
      alert(`Unit "${form.unit}" is not valid for "${form.name}". Please choose a correct unit.`);
      return;
    }

    if (expiryRequired && !form.expiration_date) {
      alert("Please enter an expiration date for this item.");
      return;
    }

    await onSubmit({
      ...form,
      category,
      quantity: parseFloat(form.quantity),
      expiration_date: form.expiration_date || null
    });

    navigate("/inventory");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px"
      }}
    >
      <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Add New Ingredient</h3>

      {message && (
        <div style={{ marginBottom: "12px", color: isVerified ? "green" : "red" }}>{message}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Name + Fetch Button */}
        <div>
          <label htmlFor="name">Name</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => {
                const newName = e.target.value;
                setForm({ ...form, name: newName, unit: "" });
                setIsVerified(false);
                setMessage("");
                setAllowedUnits([]);
                setExpiryRequired(true);
              }}
              required
              style={{
                flex: 1,
                padding: "6px",
                border: "1px solid",
                borderColor: isVerified ? "green" : "#ccc"
              }}
              placeholder="Ingredient name"
            />
            <button
              type="button"
              onClick={handleFetchUnits}
              style={{
                padding: "6px 12px",
                backgroundColor: "#e2e8f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ✔
            </button>
          </div>
        </div>

        {/* Quantity + Unit */}
        <div>
          <label htmlFor="quantity">Quantity</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="quantity"
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              placeholder="Amount"
              style={{ flex: 1, padding: "6px" }}
              disabled={!isVerified}
            />
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
              disabled={!isVerified}
              style={{ width: "120px", padding: "6px" }}
            >
              <option value="">Unit</option>
              {allowedUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiration_date">Expiry Date</label>
          <input
            id="expiration_date"
            type="date"
            value={form.expiration_date}
            onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
            style={{ width: "100%", padding: "6px" }}
            disabled={!isVerified || !expiryRequired}
          />
          {!expiryRequired && (
            <small style={{ fontSize: "0.8rem", color: "#666" }}>
              Not required for fresh produce like fruits or vegetables
            </small>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          type="button"
          onClick={onCancel || (() => navigate("/inventory"))}
          style={{ padding: "8px 12px" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            backgroundColor: "#f97316",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Add Ingredient
        </button>
      </div>
    </form>
  );
}
