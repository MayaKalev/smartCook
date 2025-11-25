// src/components/dashboard/InventoryStatus.jsx
import React from "react";
import { differenceInCalendarDays } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function InventoryStatus({ inventory, loading }) {
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const getExpiringSoon = () =>
    safeInventory.filter((item) => {
      if (!item.expiration_date) return false;
      const daysLeft = differenceInCalendarDays(new Date(item.expiration_date), new Date());
      return daysLeft >= 0 && daysLeft <= 3;
    });

  const getAlreadyExpired = () =>
    safeInventory.filter((item) => {
      if (!item.expiration_date) return false;
      const daysLeft = differenceInCalendarDays(new Date(item.expiration_date), new Date());
      return daysLeft < 0;
    });

  const getLowStock = () => safeInventory.filter((item) => item.quantity <= 2);

  const renderList = (items, labelFn, color) => (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item) => (
        <li key={item.id} style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "15px"
        }}>
          <span>{item.name}</span>
          <span style={{ color }}>{labelFn(item)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
      {/* Expiring Soon */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#fcfcff" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>Expiring Soon</h3>
        {loading ? <p>Loading...</p> :
          getExpiringSoon().length > 0
            ? renderList(getExpiringSoon(), item => {
              const days = differenceInCalendarDays(new Date(item.expiration_date), new Date());
              return `${days} days left`;
            }, "#e69e00")
            : <p style={{ color: "#777" }}>No ingredients expiring soon</p>
        }
      </div>

      {/* Already Expired */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#fff8f8" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>Already Expired</h3>
        {loading ? <p>Loading...</p> :
          getAlreadyExpired().length > 0
            ? renderList(getAlreadyExpired(), item => {
              const days = differenceInCalendarDays(new Date(item.expiration_date), new Date());
              return `${Math.abs(days)} days ago`;
            }, "crimson")
            : <p style={{ color: "#777" }}>No expired ingredients</p>
        }
      </div>

      {/* Low Stock */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#f9f9f9" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>Low Stock</h3>
        {loading ? <p>Loading...</p> :
          getLowStock().length > 0
            ? renderList(getLowStock(), item => `${item.quantity} ${item.unit}`, "#555")
            : <p style={{ color: "#777" }}>No ingredients in low stock</p>
        }
      </div>

      {/* Button */}
      <Link to="/inventory">
        <button
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#f97316",
            color: "white",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Manage Inventory
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </Link>
    </div>
  );
}
