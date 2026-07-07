import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./Login.css";

export default function Login({ onLogin, onSignUp }) {
  const [formData, setFormData] = useState({
    identifier: "", // email or mobile number
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");

    // 1. Check if these are the admin credentials.
    try {
      const res = await axios.post(`${API_BASE}/admin-login`, {
        email: formData.identifier,
        password: formData.password,
      });

      if (res.data.status === "success") {
        setLoading(false);
        if (onLogin) onLogin({ ...formData, role: "admin" });
        return;
      }
    } catch (err) {
      // A non-401 error here means something is actually broken
      // (server down, misconfigured), not just "wrong admin creds".
      if (err.response && err.response.status !== 401) {
        setLoading(false);
        setError("Something went wrong. Check that the backend server is running.");
        return;
      }
      // 401 just means "not the admin" — fall through to shop login below.
    }

    // 2. Check against real, approved shop accounts.
    try {
      const res = await axios.post(`${API_BASE}/shop-login`, {
        email: formData.identifier,
        password: formData.password,
      });

      if (res.data.status === "success") {
        setLoading(false);
        localStorage.setItem("shop", JSON.stringify(res.data.shop));
        if (onLogin) onLogin({ ...formData, role: "user" });
        return;
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.detail || "Invalid email or password."
      );
      return;
    }

    // Should not normally reach here, but fail closed just in case.
    setLoading(false);
    setError("Invalid email or password.");
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="identifier"
            placeholder="Email or Mobile Number"
            value={formData.identifier}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          {error && (
            <p style={{ color: "#dc2626", fontSize: 14, margin: "4px 0 0" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <div className="signup-row">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="signup-btn"
            onClick={onSignUp}
          >
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}
