import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE } from "../config";
import "./ChangePassword.css";

export default function ChangePassword({ shop, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleValidate = () => {
    const errors = {};
    if (!currentPassword) {
      errors.current = "Current password is required";
    }
    if (!newPassword) {
      errors.new = "New password is required";
    } else if (newPassword.length < 6) {
      errors.new = "New password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirm = "Please confirm your new password";
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirm = "Passwords do not match";
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.new = "New password cannot be the same as current password";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccess(false);

    const errors = handleValidate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!shop?.id) {
      setGeneralError("Shop account information is missing. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/shops/${shop.id}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.data.status === "success") {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFieldErrors({});
      }
    } catch (err) {
      console.error("Change password failed:", err);
      const detail =
        err.response?.data?.detail ||
        "Could not change password. Please check your connection and try again.";
      setGeneralError(detail);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="change-pwd-overlay" onClick={onClose}>
      <div className="change-pwd-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="change-pwd-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="change-pwd-header">
          <h2>🔒 Change Password</h2>
        </div>
        <p className="change-pwd-subtitle">
          Update your shop account password. Make sure the new password is at least 6 characters.
        </p>

        {generalError && (
          <div className="change-pwd-general-error">{generalError}</div>
        )}

        {success && (
          <div className="change-pwd-success">
            Password changed successfully! You can use your new password next time you log in.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="change-pwd-field">
            <label>Current Password</label>
            <div className="change-pwd-input-wrap">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setGeneralError("");
                  if (fieldErrors.current) {
                    setFieldErrors((prev) => ({ ...prev, current: "" }));
                  }
                }}
                className={fieldErrors.current ? "input-error" : ""}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="change-pwd-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                title={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? "🐵" : "🙈"}
              </button>
            </div>
            {fieldErrors.current && (
              <div className="change-pwd-error">{fieldErrors.current}</div>
            )}
          </div>

          <div className="change-pwd-field">
            <label>New Password</label>
            <div className="change-pwd-input-wrap">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setGeneralError("");
                  if (fieldErrors.new) {
                    setFieldErrors((prev) => ({ ...prev, new: "" }));
                  }
                }}
                className={fieldErrors.new ? "input-error" : ""}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="change-pwd-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? "🐵" : "🙈"}
              </button>
            </div>
            {fieldErrors.new && (
              <div className="change-pwd-error">{fieldErrors.new}</div>
            )}
          </div>

          <div className="change-pwd-field">
            <label>Confirm New Password</label>
            <div className="change-pwd-input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setGeneralError("");
                  if (fieldErrors.confirm) {
                    setFieldErrors((prev) => ({ ...prev, confirm: "" }));
                  }
                }}
                className={fieldErrors.confirm ? "input-error" : ""}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="change-pwd-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? "🐵" : "🙈"}
              </button>
            </div>
            {fieldErrors.confirm && (
              <div className="change-pwd-error">{fieldErrors.confirm}</div>
            )}
          </div>

          <div className="change-pwd-actions">
            <button
              type="button"
              className="change-pwd-cancel"
              onClick={onClose}
            >
              {success ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              className="change-pwd-submit"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
