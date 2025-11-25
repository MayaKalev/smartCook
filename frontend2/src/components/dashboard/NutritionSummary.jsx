import React, { useEffect, useState } from "react";

export default function NutritionSummary({ userId }) {
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("weekly"); // "weekly" or "daily"

  useEffect(() => {
    loadSummary();
  }, [mode]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/nutrition/summary?user_id=${userId}&group=${mode}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.summary);
      setGoals(data.goals || {});
    } catch (error) {
      console.error("Error loading nutrition summary:", error);
      setSummary(null); // Reset summary if error
    } finally {
      setLoading(false);
    }
  };

  const renderBar = (label, value, goal) => {
    const achieved = goal && value >= goal;
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm font-medium">
          <span>{label}</span>
          <span>
            {value} / {goal || "?"}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded">
          <div
            className={`h-2 rounded ${achieved ? "bg-green-500" : "bg-yellow-400"}`}
            style={{
              width: goal ? `${Math.min((value / goal) * 100, 100)}%` : "0%",
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <p>Loading nutrition summary...</p>;

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🥗 Nutrition Summary</h2>
        <button
          onClick={() => setMode(mode === "weekly" ? "daily" : "weekly")}
          className="text-sm text-blue-600 underline"
        >
          View {mode === "weekly" ? "Daily" : "Weekly"}
        </button>
      </div>

      {mode === "weekly" && summary?.average_per_day ? (
        <div>
          <p className="font-medium text-gray-700 mb-2">Daily Averages</p>
          {renderBar("Calories", summary.average_per_day.calories, goals.calorie_goal)}
          {renderBar("Protein (g)", summary.average_per_day.protein, goals.protein_goal)}
          {renderBar("Carbs (g)", summary.average_per_day.carbs, goals.carbs_goal)}
          {renderBar("Fat (g)", summary.average_per_day.fat, goals.fat_goal)}
        </div>
      ) : null}

      {mode === "daily" && Array.isArray(summary) && summary.length > 0 && (
        <div className="space-y-4">
          {summary
            .filter((entry) => entry.date === new Date().toISOString().slice(0, 10))
            .map((entry) => (
              <div key={entry.date} className="border-b pb-2">
                <p className="font-medium text-gray-800">{entry.date}</p>
                {renderBar("Calories", entry.calories, goals.calorie_goal)}
                {renderBar("Protein (g)", entry.protein, goals.protein_goal)}
                {renderBar("Carbs (g)", entry.carbs, goals.carbs_goal)}
                {renderBar("Fat (g)", entry.fat, goals.fat_goal)}
              </div>
            ))}
        </div>
      )}

      {mode === "daily" && (!summary || summary.length === 0) && (
        <p className="text-sm text-gray-500">No data logged in the past 7 days.</p>
      )}
    </div>
  );
}
