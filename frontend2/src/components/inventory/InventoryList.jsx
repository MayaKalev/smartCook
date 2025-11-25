import React, { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Pencil, Save, Trash2, X } from "lucide-react";

export default function InventoryList({ ingredients, loading, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sortBy, setSortBy] = useState("name");
  const [showOnlyExpired, setShowOnlyExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getExpiryStatus = (date) => {
    if (!date) return null;
    const daysUntilExpiry = differenceInCalendarDays(new Date(date), new Date());
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 3) return "expiring-soon";
    return "good";
  };

  const getRowStyle = (date) => {
    const status = getExpiryStatus(date);
    if (status === "expired") return { backgroundColor: "#ffe6e6" };
    if (status === "expiring-soon") return { backgroundColor: "#fff5e6" };
    return {};
  };

  const handleEdit = (ingredient) => {
    setEditingId(ingredient.id);
    setEditForm({
      ...ingredient,
      expiration_date: ingredient.expiration_date || "",
    });
  };

  const handleSave = async () => {
    await onUpdate(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const filteredIngredients = ingredients
    .filter((ing) => {
      const nameMatch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isExpired = getExpiryStatus(ing.expiration_date) === "expired";
      return nameMatch && (!showOnlyExpired || isExpired);
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") {
        const aDate = new Date(a.expiration_date || "3000-01-01");
        const bDate = new Date(b.expiration_date || "3000-01-01");
        return aDate - bDate;
      }
      return 0;
    });

  if (loading) return <p>Loading inventory...</p>;

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
          background: "#f9f9f9",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold", marginRight: "6px" }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="name">Name (A-Z)</option>
            <option value="date">Expiry Date</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", fontWeight: "bold" }}>
          <input
            type="checkbox"
            checked={showOnlyExpired}
            onChange={(e) => setShowOnlyExpired(e.target.checked)}
            style={{ marginRight: "8px", transform: "scale(1.2)" }}
          />
          Only Expired
        </label>

        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", flexGrow: 1, minWidth: "180px" }}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>Name</th>
            <th>Quantity</th>
            <th>Expiry Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredIngredients.map((ingredient) => {
            const date = ingredient.expiration_date;
            const status = getExpiryStatus(date);

            return (
              <tr key={ingredient.id} style={{ borderBottom: "1px solid #ddd", ...getRowStyle(date) }}>
                <td>
                  {editingId === ingredient.id ? (
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    ingredient.name
                  )}
                </td>
                <td>
                  {editingId === ingredient.id ? (
                    <>
                      <input
                        type="number"
                        value={editForm.quantity || ""}
                        onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                        style={{ width: "60px", marginRight: "4px" }}
                      />
                      <input
                        value={editForm.unit || ""}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        style={{ width: "60px" }}
                      />
                    </>
                  ) : (
                    `${ingredient.quantity} ${ingredient.unit}`
                  )}
                </td>
                <td>
                  {editingId === ingredient.id ? (
                    <input
                      type="date"
                      value={editForm.expiration_date || ""}
                      onChange={(e) => setEditForm({ ...editForm, expiration_date: e.target.value })}
                    />
                  ) : date ? (
                    <>
                      {format(new Date(date), "MMM d, yyyy")}
                      {status === "expired" && (
                        <span style={{ color: "red", marginLeft: "8px" }}>Expired</span>
                      )}
                      {status === "expiring-soon" && (
                        <span style={{ color: "orange", marginLeft: "8px" }}>
                          <AlertTriangle className="inline w-3 h-3" /> Expiring Soon
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "gray" }}>No Date</span>
                  )}
                </td>
                <td>
                  {editingId === ingredient.id ? (
                    <>
                      <button onClick={handleCancel} title="Cancel">
                        <X className="inline w-4 h-4" />
                      </button>
                      <button onClick={handleSave} title="Save" style={{ color: "green", marginLeft: "6px" }}>
                        <Save className="inline w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(ingredient)} title="Edit">
                        <Pencil className="inline w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(ingredient.id)}
                        title="Delete"
                        style={{ color: "red", marginLeft: "6px" }}
                      >
                        <Trash2 className="inline w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
