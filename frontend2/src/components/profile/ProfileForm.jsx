import React, { useState, useEffect } from "react";

export default function ProfileForm({ profile, loading, onSave }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    image: "",
    calorie_goal: "",
    protein_goal: "",
    carbs_goal: "",
    fat_goal: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        password: profile.password || "",
        image: profile.image || "",
        calorie_goal: profile.calorie_goal || "",
        protein_goal: profile.protein_goal || "",
        carbs_goal: profile.carbs_goal || "",
        fat_goal: profile.fat_goal || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-4">
      <div>
        <label className="block font-medium">First Name</label>
        <input
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Last Name</label>
        <input
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Profile Picture</label>
        {formData.image && (
          <img src={formData.image} alt="Profile" className="w-24 h-24 rounded-full mb-2" />
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {/* 🥗 Nutrition Goals */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Calorie Goal</label>
          <input
            type="number"
            name="calorie_goal"
            value={formData.calorie_goal}
            onChange={handleChange}
            className="w-full border rounded p-2"
            min="0"
          />
        </div>

        <div>
          <label className="block font-medium">Protein Goal (g)</label>
          <input
            type="number"
            name="protein_goal"
            value={formData.protein_goal}
            onChange={handleChange}
            className="w-full border rounded p-2"
            min="0"
          />
        </div>

        <div>
          <label className="block font-medium">Carbs Goal (g)</label>
          <input
            type="number"
            name="carbs_goal"
            value={formData.carbs_goal}
            onChange={handleChange}
            className="w-full border rounded p-2"
            min="0"
          />
        </div>

        <div>
          <label className="block font-medium">Fat Goal (g)</label>
          <input
            type="number"
            name="fat_goal"
            value={formData.fat_goal}
            onChange={handleChange}
            className="w-full border rounded p-2"
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded"
        >
          Save Profile
        </button>

        {showSuccess && (
          <span className="text-green-700 font-semibold bg-green-100 px-3 py-1 rounded text-sm">
            ✅ Profile updated successfully!
          </span>
        )}
      </div>
    </form>
  );
}
