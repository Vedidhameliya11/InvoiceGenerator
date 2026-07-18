import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE } from "../config";
import "./EditProfile.css";

export default function ViewProfile({ shop, onClose, onEdit }) {
  const [details, setDetails] = useState({
    owner_name: shop?.owner_name || "",
    email: shop?.email || "",
    shop_name: shop?.shop_name || "",
    contact_no: shop?.contact_no || "",
    shop_address: shop?.shop_address || "",
  });
  const [loading, setLoading] = useState(true);

  // Always pull the latest saved details from the server when this
  // opens, so it reflects any edit made via the Edit Profile form —
  // even if this modal was opened in a fresh page load.
  useEffect(() => {
    const fetchLatest = async () => {
      if (!shop?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/shops/${shop.id}`);
        setDetails({
          owner_name: res.data.owner_name,
          email: res.data.email,
          shop_name: res.data.shop_name,
          contact_no: res.data.contact_no,
          shop_address: res.data.shop_address,
        });
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [shop?.id]);

  return createPortal(
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="edit-profile-close" onClick={onClose}>
          ✕
        </button>

        <div className="edit-profile-header">
          <h2>My Profile</h2>
        </div>

        {loading ? (
          <p className="edit-profile-loading">Loading your details...</p>
        ) : (
          <>
            <div className="view-profile-row">
              <span className="view-profile-label">Owner Name</span>
              <span className="view-profile-value">{details.owner_name}</span>
            </div>
            <div className="view-profile-row">
              <span className="view-profile-label">Email</span>
              <span className="view-profile-value">{details.email}</span>
            </div>
            <div className="view-profile-row">
              <span className="view-profile-label">Shop Name</span>
              <span className="view-profile-value">{details.shop_name}</span>
            </div>
            <div className="view-profile-row">
              <span className="view-profile-label">Contact Number</span>
              <span className="view-profile-value">{details.contact_no}</span>
            </div>
            <div className="view-profile-row">
              <span className="view-profile-label">Shop Address</span>
              <span className="view-profile-value">{details.shop_address}</span>
            </div>

            <div className="edit-profile-actions">
              <button type="button" className="edit-profile-cancel" onClick={onClose}>
                Close
              </button>
              <button type="button" className="edit-profile-save" onClick={onEdit}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}