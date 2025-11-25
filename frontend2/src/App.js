import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";


import ScanProduct from "./pages/ScanProduct";
import InventoryAddPage from "./components/inventory/InventoryAddPage";


import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Preferences from "./pages/Preferences";
import Assistant from "./pages/Assistant";
import Profile from "./pages/Profile";

function NavigationBar({ isLoggedIn, username, imageUrl, handleLogout }) {
  return (
    <nav className="bg-white/80 backdrop-blur shadow-md px-6 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* צד שמאל – ניווט עיקרי */}
        <ul className="flex gap-6 items-center">
          {isLoggedIn && (
            <>
              <li>
                <NavLink to="/" end className={({ isActive }) =>
                  isActive ? "font-bold text-pink-500 border-b-2 border-pink-400 pb-1" : "hover:text-pink-400 transition"}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/inventory" className={({ isActive }) =>
                  isActive ? "font-bold text-blue-500 border-b-2 border-blue-400 pb-1" : "hover:text-blue-400 transition"}>
                  Inventory
                </NavLink>
              </li>
              <li>
                <NavLink to="/scan" className={({ isActive }) =>
                  isActive ? "font-bold text-yellow-500 border-b-2 border-yellow-400 pb-1" : "hover:text-yellow-400 transition"}>
                  Scan
                </NavLink>
              </li>
              <li>
                <NavLink to="/assistant" className={({ isActive }) =>
                  isActive ? "font-bold text-purple-500 border-b-2 border-purple-400 pb-1" : "hover:text-purple-400 transition"}>
                  Assistant
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* צד ימין – הגדרות ופרופיל */}
        <div className="flex items-center gap-6">
          {isLoggedIn && (
            <>
              <NavLink to="/preferences" className={({ isActive }) =>
                isActive ? "font-bold text-green-500 border-b-2 border-green-400 pb-1" : "hover:text-green-400 transition"}>
                Preferences
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) =>
                isActive ? "font-bold text-orange-500 border-b-2 border-orange-400 pb-1" : "hover:text-orange-400 transition"}>
                Profile
              </NavLink>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border object-cover"
                />
              )}
              <span className="text-sm text-gray-700">👋 Hello, {username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm"
              >
                Logout
              </button>
            </>
          )}
          {!isLoggedIn && (
            <>
              <NavLink to="/login" className="text-sm text-gray-600 hover:text-blue-500">Login</NavLink>
              <NavLink to="/register" className="text-sm text-gray-600 hover:text-green-500">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const updateUserFromStorage = () => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");

    setIsLoggedIn(!!token);
    setUsername(storedUser.username || storedUser.first_name || "");
    setImageUrl(storedUser.image_url || "");
  };

  useEffect(() => {
    updateUserFromStorage();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("smartcookUser");
    setIsLoggedIn(false);
    setUsername("");
    setImageUrl("");
    window.location.href = "/login";
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 text-gray-800 font-sans">
        <NavigationBar
          isLoggedIn={isLoggedIn}
          username={username}
          imageUrl={imageUrl}
          handleLogout={handleLogout}
        />
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/scan" element={<ScanProduct />} />
            <Route path="/inventory/add" element={<InventoryAddPage />} />
            <Route path="/login" element={
              <Login
                setIsLoggedIn={setIsLoggedIn}
                setUsername={setUsername}
                setImageUrl={setImageUrl}
              />
            } />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}