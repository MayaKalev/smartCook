import React, { useEffect, useState } from "react";
import RecommendedRecipes from "../components/dashboard/RecommendedRecipes";
import InventoryStatus from "../components/dashboard/InventoryStatus";
import NutritionSummary from "../components/dashboard/NutritionSummary";

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id || 1;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [prefsRes, inventoryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/preferences/${userId}`),
        fetch(`http://localhost:5000/api/inventory/${userId}`)
      ]);

      if (![prefsRes, inventoryRes].every(r => r.ok)) {
        throw new Error("preferences or inventory API request failed.");
      }

      const [prefsData, inventoryData] = await Promise.all([
        prefsRes.json(),
        inventoryRes.json()
      ]);

      setUserPrefs(prefsData);

      const rawInventory = inventoryData.inventory || [];
      const cleanedInventory = rawInventory.map((item) => ({
        ...item,
        expiration_date: item.expiration_date ||  null
      }));

      console.log("✅ Inventory loaded:", cleanedInventory);
      setInventory(cleanedInventory);

      // ✨ קריאת מתכונים עם userPrefs
      const recipesRes = await fetch(`http://localhost:5000/api/recipes/recommended`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          user_message: "What can I cook today?",
          user_prefs: prefsData,
          num_recipes: 3
        })
      });

      const recipesData = await recipesRes.json();
      console.log("🔍 Recipes received:", recipesData.recipes);
      console.log("🔢 Requested:", 3, "| Received:", recipesData.recipes?.length);
      setRecipes(Array.isArray(recipesData.recipes) ? recipesData.recipes : []);


    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
  try {
    const res = await fetch(`http://localhost:5000/api/assistant/refresh/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_prefs: userPrefs,
        user_message: "What can I cook today?"
      })
    });

    const data = await res.json();

    if (res.ok && Array.isArray(data.recipes)) {
      console.log("🔄 Refreshed recipes received:", data.recipes);
      setRecipes(data.recipes);  // 👈 שמירה ישירה ל־state
    } else {
      console.warn("⚠️ No recipes received from refresh.");
    }
  } catch (error) {
    console.error("Error refreshing recommendations:", error);
  }
};



  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to SmartCook</h1>

      <button
        onClick={refreshRecommendations}
        className="mb-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        🔄 Refresh Recommendations
      </button>
      
      <NutritionSummary userId={userId} />
      <RecommendedRecipes recipes={recipes} loading={loading} userId={userId} />
      <InventoryStatus inventory={inventory} loading={loading} />
    </div>
  );
}
