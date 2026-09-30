import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./Login.css";

export default function Login({ onLogin, onSignUp }) {
  const [formData, setFormData] = useState({
    identifier: "", // email or mobile number
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
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

    const ident = formData.identifier.trim();
    const pwd = formData.password.trim();

    if (!ident || !pwd) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");

    // 1. Check if these are the admin credentials.
    try {
      const res = await axios.post(`${API_BASE}/admin-login`, {
        email: ident,
        password: pwd,
      });

      if (res.data.status === "success") {
        setLoading(false);
        if (onLogin) onLogin({ role: "admin" });
        return;
      }
    } catch (err) {
      if (!err.response) {
        setLoading(false);
        setError(
          "Could not reach the server. Please check your connection and try again."
        );
        return;
      }
      if (err.response.status !== 401) {
        setLoading(false);
        setError("Something went wrong. Check that the backend server is running.");
        return;
      }
    }

    // 2. Check against real, approved shop accounts.
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        identifier: ident,
        email: ident,
        password: pwd,
      });

      setLoading(false);
      if (res.data.status === "success") {
        onLogin({ role: "user", shop: res.data.shop });
      }
    } catch (err) {
      setLoading(false);
      if (!err.response) {
        setError(
          "Could not reach the server. Please check your connection and try again."
        );
        return;
      }
      setError(
        err.response?.data?.detail || "Invalid email or password."
      );
    }
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

          <div className="login-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🐵" : "🙈"}
            </button>
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: 14, margin: "4px 0 12px" }}>
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
            Register
          </button>
        </div>

      </div>
    </div>
  );
}