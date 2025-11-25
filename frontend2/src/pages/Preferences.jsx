// src/pages/Preferences.jsx
import React, { useEffect, useState } from "react";
import PreferencesForm from "../components/profile/PreferencesForm";

export default function Preferences() {
  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id || storedUser.id || 1;

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/preferences/${userId}`);
      if (!res.ok) throw new Error(`GET preferences failed: ${res.status}`);
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const url = `http://localhost:5000/api/preferences/${userId}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`PUT preferences failed: ${res.status}`);
      loadPreferences(); // reload after save
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 mb-6">
          👤 Preferences Settings
        </h1>
        <PreferencesForm
          preferences={preferences}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
