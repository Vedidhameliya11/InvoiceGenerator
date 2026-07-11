import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE } from "../config";
import "./EditProfile.css";

export default function EditProfile({ shop, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    owner_name: shop?.owner_name || "",
    email: shop?.email || "",
    shop_name: shop?.shop_name || "",
  });
  const [readOnly, setReadOnly] = useState({
    contact_no: shop?.contact_no || "",
    shop_address: shop?.shop_address || "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!shop?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/shops/${shop.id}`);
        setFormData({
          owner_name: res.data.owner_name,
          email: res.data.email,
          shop_name: res.data.shop_name,
        });
        setReadOnly({
          contact_no: res.data.contact_no,
          shop_address: res.data.shop_address,
        });
      } catch (err) {
        console.error("Failed to load latest profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [shop?.id]);

  const handleChange = (e) => {
    setError("");
    setSuccess(false);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.owner_name.trim() || !formData.email.trim() || !formData.shop_name.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await axios.put(`${API_BASE}/shops/${shop.id}/profile`, formData);
      const updatedShop = { ...res.data };
      localStorage.setItem("shopUser", JSON.stringify(updatedShop));
      setSuccess(true);
      if (onUpdated) onUpdated(updatedShop);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not update profile. Check that the backend server is running."
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="edit-profile-close" onClick={onClose}>
          ✕
        </button>

        <div className="edit-profile-header">
          <h2>Edit Profile</h2>
        </div>

        {loading ? (
          <p className="edit-profile-loading">Loading your details...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="field-label">Owner Name</label>
            <input
              type="text"
              name="owner_name"
              placeholder="Owner Name"
              value={formData.owner_name}
              onChange={handleChange}
            />

            <label className="field-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            <label className="field-label">Shop Name</label>
            <input
              type="text"
              name="shop_name"
              placeholder="Shop Name"
              value={formData.shop_name}
              onChange={handleChange}
            />

            <label className="field-label">Contact Number</label>
            <input type="text" value={readOnly.contact_no} disabled readOnly />

            <label className="field-label">Shop Address</label>
            <input type="text" value={readOnly.shop_address} disabled readOnly />

            {error && <p className="edit-profile-error">{error}</p>}
            {success && <p className="edit-profile-success">Profile updated successfully.</p>}

            <div className="edit-profile-actions">
              <button type="button" className="edit-profile-cancel" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="edit-profile-save" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}