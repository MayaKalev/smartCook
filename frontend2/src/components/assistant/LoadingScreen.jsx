import React from "react";
import { ChefHat } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="animate-bounce">
          <ChefHat className="w-12 h-12 text-orange-500" />
        </div>
        <h2 style={{ marginTop: "1rem", fontSize: "1.25rem", fontWeight: "600" }}>
          Loading Kitchen Assistant
        </h2>
        <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
          Preparing your personalized experience...
        </p>
      </div>
    </div>
  );
}