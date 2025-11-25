import React, { useState, useEffect } from "react";

function Tooltip({ text }) {
  return (
    <div className="relative group inline-block ml-2">
      <span className="text-gray-400 cursor-pointer">ⓘ</span>
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-lg">
        {text}
      </div>
    </div>
  );
}

export default function PreferencesForm({ preferences, loading, onSubmit }) {
  const [formData, setFormData] = useState({
    dietary: [],
    allergies: [],
    additionalAllergies: "",
    skillLevel: "",
    mealPrep: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const toggleSelection = (type, value) => {
    setFormData((prev) => {
      const updated = prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value];
      return { ...prev, [type]: updated };
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  if (loading || !formData) return <p>Loading preferences...</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-semibold mb-6">Cooking & Dietary Preferences</h2>

      {/* Dietary Restrictions */}
      <div className="mb-6">
        <h3 className="font-medium mb-2 flex items-center">
          Dietary Restrictions
          <Tooltip text="Choose any dietary styles you follow regularly. These will help us filter recipes that match your preferences." />
        </h3>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
          {["Vegetarian", "Vegan", "Gluten Free", "Kosher", "Halal", "Keto", "Paleo"].map(
            (item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.dietary.includes(item)}
                  onChange={() => toggleSelection("dietary", item)}
                />
                {item}
              </label>
            )
          )}
        </div>
      </div>

      {/* Allergies */}
      <div className="mb-6">
        <h3 className="font-medium mb-2 flex items-center">
          Allergies
          <Tooltip text="Select any known allergies. We’ll avoid recipes that contain these ingredients." />
        </h3>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
          {["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Wheat", "Soy", "Fish", "Sesame"].map(
            (item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.allergies.includes(item)}
                  onChange={() => toggleSelection("allergies", item)}
                />
                {item}
              </label>
            )
          )}
        </div>
      </div>

      {/* Additional Allergies */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          Additional Allergies
          <Tooltip text="Add any extra allergies not listed above, separated by commas (e.g., avocado, cinnamon)." />
        </label>
        <input
          type="text"
          name="additionalAllergies"
          value={formData.additionalAllergies}
          onChange={handleChange}
          placeholder="e.g., avocado, nightshades..."
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-pink-200 outline-none"
        />
      </div>

      {/* Cooking Skill & Meal Prep */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Cooking Skill Level
            <Tooltip text="Beginner: basic knowledge. Intermediate: can follow most recipes. Expert: very comfortable in the kitchen." />
          </label>
          <select
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
          >
            <option value="">Select your cooking skill level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Meal Prep Preference
            <Tooltip text="Quick & Easy: minimal effort. Gourmet: more advanced meals. Healthy Focused: light, nutritious options." />
          </label>
          <select
            name="mealPrep"
            value={formData.mealPrep}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
          >
            <option value="">Your meal prep style</option>
            <option>Quick & Easy</option>
            <option>Gourmet</option>
            <option>Healthy Focused</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="bg-pink-300 hover:bg-pink-400 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
        >
          Save Changes
        </button>
        {showSuccess && (
          <span className="text-green-600 font-medium text-sm">
            ✅ Saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
