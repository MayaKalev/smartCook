// src/components/recipes/RecipeCard.jsx
import React, { useEffect, useState } from "react";
import {
  Timer,
  Users,
  ChefHat,
  Star,
  Image as ImageIcon,
  Save,
  Check,
} from "lucide-react";
import { fetchImage } from "../../utils/fetchImage";
import RatingStars from "../ui/RatingStars";

export default function RecipeCard({ recipe, showRating = true, userId }) {
  /* -------------------- local state -------------------- */
  const [fallbackImage, setFallbackImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [average, setAverage] = useState(0);
  const [numRatings, setNumRatings] = useState(0);

  /* ------------------- destructure --------------------- */
  const {
    title = "AI Suggested Recipe",
    description = "",
    image_url,
    servings = 2,
    difficulty = "Medium",
    prep_minutes = 15,
    cook_minutes = 25,
    dietary_tags = [],
    ingredients = [],
    instructions = [],
    nutrition = null,
    recipe_hash,
  } = recipe || {};

  const totalMinutes = prep_minutes + cook_minutes;
  const perServing = nutrition?.per_serving || {};

  /* --------------- fetch fallback image ---------------- */
  useEffect(() => {
    if (!image_url && title) {
      fetchImage(title).then((url) => url && setFallbackImage(url));
    }
  }, [image_url, title]);

  /* ---------------- load average rating --------------- */
  const refreshRating = () => {
    if (!recipe_hash) return;
    fetch(`http://localhost:5000/api/recipes/rating/${recipe_hash}`)
      .then((res) => res.json())
      .then((data) => {
        const avg = Number(data.average_rating);
        setAverage(isFinite(avg) ? avg : 0);
        setNumRatings(data.num_ratings || 0);
      })
      .catch(() => {
        setAverage(0);
        setNumRatings(0);
      });
  };
  useEffect(() => refreshRating(), [recipe_hash]);

  /* --------------------- save recipe -------------------- */
  const handleSave = async () => {
    try {
      console.log("🔍 recipe being saved:", recipe);
      const res = await fetch(
        `http://localhost:5000/api/recipes/saved/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipe),
        }
      );
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("❌ Failed to save recipe:", err);
    }
  };

  /* -------------- update inventory (use recipe) --------- */
  const handleUseRecipe = async () => {
    if (!userId || !Array.isArray(ingredients)) {
      alert("Missing user or ingredients");
      return;
    }

    const formatted = ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    }));

    try {
      const res = await fetch("http://localhost:5000/api/use-recipe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          recipe_hash,
          title,
          ingredients: formatted,
          nutrition,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Inventory updated!");
        console.log("📦 Updated items:", data.updated_items);
      } else {
        alert("❌ Inventory update failed");
        console.error("🔴 Error:", data);
      }
    } catch (err) {
      console.error("⚠️ Network error:", err);
      alert("⚠️ Request error");
    }
  };

  if (!recipe) return null;

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white max-w-sm text-sm">
      {/* ---------- image ---------- */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {image_url || fallbackImage ? (
          <img
            src={image_url || fallbackImage}
            alt={title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {showRating && isFinite(average) && average > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
            {average.toFixed(1)} ({numRatings})
          </div>
        )}
      </div>

      {/* ----------- content ----------- */}
      <div className="p-3">
        <h3 className="font-semibold text-base mb-1 leading-tight line-clamp-2">
          {title}
        </h3>

        <RatingStars
          recipe={recipe}
          userId={userId}
          onRated={refreshRating}
        />

        {description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {description}
          </p>
        )}

        {/* meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" /> {totalMinutes} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {servings}
          </div>
          <div className="flex items-center gap-1 capitalize">
            <ChefHat className="w-3 h-3" /> {difficulty}
          </div>
        </div>

        {/* -------------- expanded details -------------- */}
        {expanded && (
          <>
            {/* ingredients */}
            {ingredients.length > 0 && (
              <div className="mb-2">
                <h4 className="font-semibold text-xs mb-1">Ingredients:</h4>
                <ul className="list-disc list-inside text-xs text-gray-700">
                  {ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* instructions */}
            {instructions.length > 0 && (
              <div className="mb-2">
                <h4 className="font-semibold text-xs mb-1">Instructions:</h4>
                <ol className="list-decimal list-inside text-xs text-gray-700">
                  {instructions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* nutrition per serving */}
            {nutrition && perServing.calories && (
              <div className="mb-2">
                <h4 className="font-semibold text-xs mb-1">
                  Nutrition&nbsp;(per&nbsp;serving):
                </h4>
                <ul className="grid grid-cols-2 gap-x-4 text-xs text-gray-700">
                  <li>Calories: {perServing.calories} kcal</li>
                  <li>Protein: {perServing.protein ?? "—"} g</li>
                  <li>Carbs: {perServing.carbs ?? "—"} g</li>
                  <li>Fat: {perServing.fat ?? "—"} g</li>
                </ul>
              </div>
            )}
          </>
        )}

        {/* toggle */}
        <button
          className="text-orange-600 text-xs mt-1 hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "See less" : "See more"}
        </button>

        {/* tags + save */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-wrap gap-2">
            {dietary_tags.length ? (
              dietary_tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-[10px] capitalize"
                >
                  {tag.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs">
                No dietary tags specified
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className="text-xs text-orange-600 flex items-center gap-1 hover:underline disabled:text-gray-400"
          >
            {saved ? (
              <>
                <Check className="w-3 h-3" /> Saved
              </>
            ) : (
              <>
                <Save className="w-3 h-3" /> Save
              </>
            )}
          </button>
        </div>

        {/* use recipe */}
        <button
          onClick={handleUseRecipe}
          className="mt-3 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700 text-xs"
        >
          🍽️ I made the recipe
        </button>
      </div>
    </div>
  );
}
