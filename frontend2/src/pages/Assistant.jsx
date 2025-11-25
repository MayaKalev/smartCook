import React, { useEffect, useState, useRef } from "react";
import KitchenAssistant from "../components/assistant/KitchenAssistant";

/* ----------------------------------------------------------- */
/*         חילוץ user_id (JWT / localStorage)                  */
/* ----------------------------------------------------------- */
const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
const userId = storedUser.user_id || 1;
const userName = storedUser.name || "SmartCook User";

export default function Assistant() {
  /* ------------------- state ------------------- */
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRecipe, setLastRecipe] = useState(null);
  const [useExpiring, setUseExpiring] = useState(false);
  const messagesEndRef = useRef(null);

  /* ------------------- load data ---------------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const invRes = await fetch(`http://localhost:5000/api/inventory/${userId}`);
        const invData = await invRes.json();

        const prefRes = await fetch(`http://localhost:5000/api/preferences/${userId}`);
        const prefData = await prefRes.json();

        setInventory(invData.inventory || []);
        setUserPrefs(prefData);
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ------------------- send message -------------- */
  const onSendMessage = async (message) => {
    const payload = {
      user_id: userId,
      message,
      user_prefs: userPrefs,
      prev_recipe: lastRecipe || null,  // ✅ שימו לב – רק אובייקט או null
      use_expiring_soon: useExpiring
    };

    try {
      const res = await fetch("http://localhost:5000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Assistant failed: ${res.status}`);
      const data = await res.json();

      if (data.recipes?.length) setLastRecipe(data.recipes[0]);

      return {
        response: "Here is your recipe suggestion:",
        recipes: data.recipes || [],
      };
    } catch (err) {
      const rawError = err?.message || String(err);
      console.error("❌ Error sending to AI:", rawError);

      return {
        response: `Sorry, something went wrong.\n\n⚠️ Error details:\n${rawError}`,
        recipes: [],
      };
    }
  };

  /* ------------------- render -------------------- */
  if (loading) return <p style={{ padding: 20 }}>Loading assistant…</p>;

  return (
    <div style={{ padding: 20 }}>
      <KitchenAssistant
        onSendMessage={onSendMessage}
        inventory={inventory}
        userPrefs={userPrefs}
        userName={userName}
        userId={userId}
        useExpiring={useExpiring}
        setUseExpiring={setUseExpiring}
      />
      <div ref={messagesEndRef} />
    </div>
  );
}
