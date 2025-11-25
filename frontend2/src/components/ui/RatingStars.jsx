// src/components/ui/RatingStars.jsx
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";

export default function RatingStars({ recipe, userId, onRated }) {
  /* -------------------------------------------------- */
  /* hash comes from backend; if missing we just hide   */
  /* -------------------------------------------------- */
  const recipeHash = recipe.recipe_hash;

  /* --------------- hooks (always executed) ----------- */
  const [hovered,  setHovered]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [average,  setAverage]  = useState(Number(recipe.average_rating) || 0);
  const [numVotes, setNumVotes] = useState(0);

  /* --------------- fetch average once ---------------- */
  useEffect(() => {
    if (!recipeHash) return;
    fetch(`http://localhost:5000/api/recipes/rating/${recipeHash}`)
      .then((res) => res.json())
      .then((d) => {
        setAverage(Number(d.average_rating) || 0);
        setNumVotes(d.num_ratings || 0);
      })
      .catch(() => {});
  }, [recipeHash]);

  /* ---------------- rating handler ------------------- */
  const handleRate = async (value) => {
    if (!recipeHash) return;
    setSelected(value);

    try {
      const res = await fetch("http://localhost:5000/api/recipes/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating: value,
          recipe: { ...recipe, recipe_hash: recipeHash },
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setAverage(Number(d.average_rating) || value);
        setNumVotes(d.num_ratings || numVotes + 1);
        onRated?.();
      }
    } catch (err) {
      console.error("Rating failed:", err);
    }
  };

  /* ------------- early return AFTER hooks ------------ */
  if (!recipeHash) return null;

  /* --------------------- render ---------------------- */
  return (
    <div className="flex items-center gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((val) => (
        <Star
          key={val}
          className={`w-4 h-4 cursor-pointer transition-colors duration-150 ${
            (hovered || selected || average) >= val
              ? "fill-yellow-400 stroke-yellow-400"
              : "stroke-gray-400"
          }`}
          onMouseEnter={() => setHovered(val)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(val)}
        />
      ))}

      <span className="text-xs text-gray-600 ml-2">
        {average > 0 ? `${average.toFixed(1)} (${numVotes})` : "No rating yet"}
      </span>
    </div>
  );
}
