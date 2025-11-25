import React, { useEffect, useState } from "react";
import ProfileForm from "../components/profile/ProfileForm";

export default function Profile() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id || storedUser.id || 1;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (!res.ok) throw new Error(`GET profile failed: ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("❌ Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    
    const parsedData = {
    ...formData,
    calorie_goal: formData.calorie_goal !== "" ? parseFloat(formData.calorie_goal) : null,
    protein_goal: formData.protein_goal !== "" ? parseFloat(formData.protein_goal) : null,
    carbs_goal: formData.carbs_goal !== "" ? parseFloat(formData.carbs_goal) : null,
    fat_goal: formData.fat_goal !== "" ? parseFloat(formData.fat_goal) : null,
  };
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`PUT profile failed: ${res.status}`);

      const existingUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
      const updatedUser = {
        ...existingUser,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        image_url: formData.image_url || formData.image,
      };
      localStorage.setItem("smartcookUser", JSON.stringify(updatedUser));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000); // ✅ נעלם אחרי 5 שניות

      loadProfile();
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">👤 My Profile</h1>

        <ProfileForm profile={profile} loading={loading} onSave={handleSave} />

      </div>
    </div>
  );
}
