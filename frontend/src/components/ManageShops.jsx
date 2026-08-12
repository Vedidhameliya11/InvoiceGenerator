import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { isValidName, isValidEmail, NAME_ERROR, EMAIL_ERROR } from "../utils/validators";
import "./ManageShops.css";


const emptyForm = {
  owner_name: "",
  email: "",
  contact_no: "",
  shop_name: "",
  shop_address: "",
};

export default function ManageShops() {
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/shops`);
      setShops(res.data);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !formData.owner_name.trim() ||
      !formData.email.trim() ||
      !formData.contact_no.trim() ||
      !formData.shop_name.trim() ||
      !formData.shop_address.trim()
    ) {
      alert("Please fill all fields.");
      return false;
    }

    if (!isValidName(formData.owner_name)) {
      alert(NAME_ERROR);
      return false;
    }

    if (!isValidEmail(formData.email)) {
      alert(EMAIL_ERROR);
      return false;
    }

    return true;
  };

  // approve=false -> just saves as "pending", no email sent
  // approve=true  -> saves and immediately approves + emails password
  const handleSubmit = async (approve) => {
    if (!validate()) return;

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/admin/shops?approve=${approve}`, formData);
      setFormData(emptyForm);
      setShowForm(false);
      await fetchShops();
      if (approve) {
        alert("Shop approved! Login details have been emailed to the owner.");
      }
    } catch (err) {
      console.error("Failed to save shop:", err);
      alert(
        err.response?.data?.detail ||
          "Could not save shop. Check that the backend server is running."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApproveFromList = async (shop) => {
    const confirmed = window.confirm(
      `Approve "${shop.shop_name}"? A password will be generated and emailed to ${shop.email}.`
    );
    if (!confirmed) return;

    try {
      await axios.post(`${API_BASE}/admin/shops/${shop.id}/approve`);
      await fetchShops();
      alert("Shop approved! Login details have been emailed to the owner.");
    } catch (err) {
      console.error("Failed to approve shop:", err);
      alert(
        err.response?.data?.detail ||
          "Could not approve shop. Check that the backend server is running."
      );
    }
  };

  const handleDelete = async (shop) => {
    const confirmed = window.confirm(`Delete "${shop.shop_name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/admin/shops/${shop.id}`);
      await fetchShops();
    } catch (err) {
      console.error("Failed to delete shop:", err);
      alert("Could not delete shop.");
    }
  };

  return (
    <div className="shops-container">

      <div className="shops-header">
        <h2>Manage Shops</h2>

        <button
          type="button"
          className="shops-toggle-btn"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <span className="shops-toggle-icon">{showForm ? "−" : "+"}</span>
          {showForm ? "Close" : "Add Shop"}
        </button>
      </div>

      {showForm && (
        <div className="shops-form-box">

          <h3>Register New Shop</h3>

          <div className="shops-form-grid">

            <div>
              <label className="field-label">Owner Name</label>
              <input
                type="text"
                name="owner_name"
                placeholder="Enter owner name"
                value={formData.owner_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label">Contact No</label>
              <input
                type="text"
                name="contact_no"
                placeholder="Enter contact number"
                value={formData.contact_no}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label">Shop Name</label>
              <input
                type="text"
                name="shop_name"
                placeholder="Enter shop name"
                value={formData.shop_name}
                onChange={handleChange}
              />
            </div>

            <div className="shops-form-full">
              <label className="field-label">Shop Address</label>
              <input
                type="text"
                name="shop_address"
                placeholder="Enter shop address"
                value={formData.shop_address}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="shops-form-actions">
            <button
              type="button"
              className="shops-save-btn"
              disabled={saving}
              onClick={() => handleSubmit(false)}
            >
              Save as Draft
            </button>

            <button
              type="button"
              className="shops-approve-btn"
              disabled={saving}
              onClick={() => handleSubmit(true)}
            >
              Approve
            </button>
          </div>

        </div>
      )}

      {loading ? (
        <p className="shops-empty">Loading shops...</p>
      ) : shops.length === 0 ? (
        <p className="shops-empty">No shops registered yet.</p>
      ) : (
        <div className="shops-table-wrapper">
          <table className="shops-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Shop Name</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td>{s.owner_name}</td>
                  <td>{s.email}</td>
                  <td>{s.contact_no}</td>
                  <td>{s.shop_name}</td>
                  <td>{s.shop_address}</td>
                  <td>
                    <span className={`status-pill ${s.status}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btn-group">
                      {s.status === "pending" && (
                        <button
                          className="action-btn approve-btn"
                          onClick={() => handleApproveFromList(s)}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(s)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
