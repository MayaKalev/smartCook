import React from "react";
import RecipeCard from "../recipes/RecipeCard";

export default function RecommendedRecipes({ recipes, loading, userId }) {
  const safeRecipes = Array.isArray(recipes) ? recipes : [];
  console.log("📦 RecommendedRecipes received:", recipes);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Recommended for You</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[180px] rounded-xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : safeRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {safeRecipes.slice(0, 6).map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} userId={userId} />
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-gray-500">
          No matching recipes found.
        </p>
      )}
    </div>
  );
}
