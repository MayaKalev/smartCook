import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ setIsLoggedIn, setUsername, setImageUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.access_token) {
        // ✅ Successful login
        localStorage.setItem('smartcookUser', JSON.stringify({
          user_id: data.user_id,
          username: data.username,
          image_url: data.image_url || ""
        }));
        localStorage.setItem('token', data.access_token);

        setIsLoggedIn(true);
        setUsername(data.username);
        setImageUrl(data.image_url || "");

        navigate('/');
      } else if (data.error) {
        // ❌ Login failed with backend error
        setError(data.error);
      } else {
        setError("Login failed.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Connection failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl mb-4 font-semibold text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          className="w-full border p-2 rounded"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="w-full border p-2 rounded"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
