import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { isValidEmail, isValidContact, NAME_ERROR, EMAIL_ERROR } from "../utils/validators";

import "./Register.css";

export default function Register({ onRegister, onLoginClick }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    shopName: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const [location] = useState({
    lat: 21.1702,
    lng: 72.8311,
  });

  const [submitting, setSubmitting] = useState(false);

  const validateField = (field, value) => {
    const val = (value || "").trim();
    switch (field) {
      case "name":
        if (!val || val.length < 2) {
          return "Owner name should have at least 2 characters";
        }
        return "";
      case "email":
        if (!val) {
          return "Email is required";
        }
        if (!isValidEmail(val)) {
          return EMAIL_ERROR;
        }
        return "";
      case "contact":
        if (!val) {
          return "Contact number is required";
        }
        if (!isValidContact(val)) {
          return "Contact number must be 10 digits";
        }
        return "";
      case "shopName":
        if (!val) {
          return "Shop name is required";
        }
        if (val.length < 2) {
          return "Shop name should have at least 2 characters";
        }
        return "";
      case "address":
        if (!val) {
          return "Shop address is required";
        }
        if (val.length < 3) {
          return "Shop address should have at least 3 characters";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setServerError("");
    if (errors[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      contact: validateField("contact", formData.contact),
      shopName: validateField("shopName", formData.shopName),
      address: validateField("address", formData.address),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => Boolean(err))) {
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_BASE}/register`, {
        owner_name: formData.name.trim(),
        email: formData.email.trim(),
        contact_no: formData.contact.trim(),
        shop_name: formData.shopName.trim(),
        shop_address: formData.address.trim(),
      });

      // Keep a local copy too, so PendingApproval / other screens can
      // still read basic shop info before the admin approves.
      localStorage.setItem(
        "shop",
        JSON.stringify({
          ...formData,
          location,
        })
      );

      if (onRegister) onRegister(true);
    } catch (err) {
      console.error("Registration failed:", err);
      const detail = err.response?.data?.detail;
      if (detail) {
        if (detail.toLowerCase().includes("owner name") || detail.toLowerCase().includes("name")) {
          setErrors((prev) => ({ ...prev, name: detail }));
        } else if (detail.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: detail }));
        } else {
          setServerError(detail);
        }
      } else {
        setServerError("Could not submit registration. Check that the backend server is running.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">

        <h2>Registration</h2>

        {serverError && <div className="server-error-banner">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Owner Name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="contact"
              placeholder="Contact Number (e.g. 9876543210)"
              value={formData.contact}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.contact ? "input-error" : ""}
            />
            {errors.contact && <span className="field-error">{errors.contact}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="shopName"
              placeholder="Shop Name"
              value={formData.shopName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.shopName ? "input-error" : ""}
            />
            {errors.shopName && <span className="field-error">{errors.shopName}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="address"
              placeholder="Shop Address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.address ? "input-error" : ""}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          {/* Google map feature hidden for now */}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Register"}
          </button>

        </form>

        <div className="login-row">
          <span>Already have an account?</span>
          <button
            type="button"
            className="login-link-btn"
            onClick={onLoginClick}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}