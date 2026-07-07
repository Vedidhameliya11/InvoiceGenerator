import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./EditProfile.css";

export default function EditProfile() {
  const storedShop = JSON.parse(localStorage.getItem("shop") || "null");

  const [formData, setFormData] = useState({
    owner_name: storedShop?.owner_name || "",
    email: storedShop?.email || "",
    shop_name: storedShop?.shop_name || "",
  });

  const [saving, setSaving] = useState(false);

  if (!storedShop) {
    return (
      <div className="edit-profile-container">
        <p className="edit-profile-empty">
          No profile found. Please log in again.
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.owner_name.trim() || !formData.email.trim() || !formData.shop_name.trim()) {
      alert("Name, Email, and Shop Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/shop-profile/${storedShop.id}`,
        formData
      );

      // Keep localStorage in sync so the rest of the app sees the update.
      const updatedShop = { ...storedShop, ...res.data };
      localStorage.setItem("shop", JSON.stringify(updatedShop));

      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(
        err.response?.data?.detail ||
          "Could not update profile. Check that the backend server is running."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>

      <div className="edit-profile-box">
        <form onSubmit={handleSubmit}>

          <label className="field-label">Owner Name</label>
          <input
            type="text"
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
          />

          <label className="field-label">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />

          <label className="field-label">Shop Name</label>
          <input
            type="text"
            name="shop_name"
            value={formData.shop_name}
            onChange={handleChange}
          />

          <label className="field-label">Contact No</label>
          <input
            type="text"
            value={storedShop.contact_no || ""}
            disabled
            className="readonly-field"
          />

          <label className="field-label">Shop Address</label>
          <input
            type="text"
            value={storedShop.shop_address || ""}
            disabled
            className="readonly-field"
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </form>
      </div>
    </div>
  );
}