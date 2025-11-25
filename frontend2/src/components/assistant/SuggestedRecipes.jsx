import React from "react";
import RecipeCard from "../recipes/RecipeCard";

export default function SuggestedRecipes({ recipes = [], onSave = () => {}, userId }) {
  if (!recipes.length) return null;

  return (
    <section className="ml-11 mt-2 border rounded-lg p-5 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Suggested Recipes</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe, i) => (
          <RecipeCard
            key={recipe.title || i}
            recipe={recipe}
            userId={userId}
            onSave={() => onSave(recipe)}
            showRating={true}
            showSaveButton={true}
            showCookButton={true}
          />
        ))}
      </div>
    </section>
  );
}
