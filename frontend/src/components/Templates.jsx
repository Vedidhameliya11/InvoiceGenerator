import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./Templates.css";

import ClassicPreview from "./ClassicPreview";
import ModernPreview from "./ModernPreview";
import CorporatePreview from "./CorporatePreview";
import MinimalPreview from "./MinimalPreview";
import PremiumPreview from "./PremiumPreview";


// Font options: the `value` is sent straight to the PDF backend
// (these are safe reportlab base fonts), and `css` is used to render
// the same font in the browser preview so it matches the PDF.
const FONT_OPTIONS = [
  { value: "Helvetica", label: "Sans Serif (Helvetica)", css: "Helvetica, Arial, sans-serif" },
  { value: "Times-Roman", label: "Serif (Times)", css: '"Times New Roman", Times, serif' },
  { value: "Courier", label: "Monospace (Courier)", css: '"Courier New", Courier, monospace' },
];

const fontCss = (value) =>
  (FONT_OPTIONS.find((f) => f.value === value) || FONT_OPTIONS[0]).css;

const emptyForm = {
  name: "",
  template: "classic",
  pricing: "free",
  price: "",
  status: "active",
  font: "Helvetica",
  color: "#2563eb",
};

const previewData = {
  organizationName: "ABC Pvt Ltd",
  customerName: "John Doe",
  productName: "Laptop",
  productPrice: 50000,
  productQuantity: 2,
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/templates`);
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to load templates from server:", err);
    } finally {
      setLoading(false);
    }
  };

  // Migration to MongoDB is done — templates now live only in the DB.
  // (Old localStorage migration code removed; it was re-inserting stale
  // local data into MongoDB on every page load.)
  useEffect(() => {
    fetchTemplates();
    localStorage.removeItem("templates"); // clear any leftover legacy key
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "pricing" && value === "free"
        ? { price: "" }
        : {}),
    }));
  };

  // Handles the "Pick up Template" select. Base-layout options just set
  // the layout. Options under "Your Templates" load that saved template's
  // layout + color + font as a starting point for the new one.
  const handleTemplateSelect = (e) => {
    const { value } = e.target;

    if (value.startsWith("existing:")) {
      const id = value.replace("existing:", "");
      const source = templates.find((t) => t.id === id);

      if (source) {
        setFormData((prev) => ({
          ...prev,
          template: source.template,
          font: source.font || "Helvetica",
          color: source.color || "#2563eb",
        }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, template: value }));
  };

  const [editingId, setEditingId] = useState(null);

  const openModal = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setFormData({
      name: t.name,
      template: t.template,
      pricing: t.pricing,
      price: t.price ?? "",
      status: t.status,
      font: t.font || "Helvetica",
      color: t.color || "#2563eb",
    });
    setEditingId(t.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter template name.");
      return;
    }

    if (formData.pricing === "paid" && !formData.price) {
      alert("Please enter price.");
      return;
    }

    const payload = {
      name: formData.name,
      template: formData.template,
      pricing: formData.pricing,
      price:
        formData.pricing === "paid"
          ? Number(formData.price)
          : null,
      status: formData.status,
      font: formData.font,
      color: formData.color,
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/templates/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE}/templates`, payload);
      }

      await fetchTemplates();
      closeModal();
    } catch (err) {
      console.error("Failed to save template:", err);
      alert("Could not save template. Check that the backend server is running.");
    }
  };

  const handleDelete = async (t) => {
    const confirmed = window.confirm(`Delete template "${t.name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/templates/${t.id}`);
      await fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert("Could not delete template. Check that the backend server is running.");
    }
  };

  const renderTemplateByType = (type, data, color, font) => {
    const props = { data, color, font: fontCss(font) };

    switch (type) {
      case "classic":
        return <ClassicPreview {...props} />;

      case "modern":
        return <ModernPreview {...props} />;

      case "corporate":
        return <CorporatePreview {...props} />;

      case "minimal":
        return <MinimalPreview {...props} />;

      case "premium":
        return <PremiumPreview {...props} />;

      default:
        return null;
    }
  };

  const renderPreview = () =>
    renderTemplateByType(
      formData.template,
      previewData,
      formData.color,
      formData.font
    );

  return (
    <div className="templates-container">

      <div className="templates-header">

        <h2>Templates</h2>

        <button
          className="add-template-btn"
          onClick={openModal}
        >
          + Add Template
        </button>

      </div>

      {loading ? (
        <p className="templates-empty">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="templates-empty">
          No templates added yet.
        </p>
      ) : (
        <div className="templates-table-wrapper">

          <table className="templates-table">

            <thead>

              <tr>

                <th>ID</th>
                <th>Name</th>
                <th>Template File</th>
                <th>Preview</th>
                <th>Pricing</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {templates.map((t, index) => (
                <tr key={t.id}>

                  <td>{index + 1}</td>

                  <td>{t.name}</td>

                  <td>{t.template}.html</td>

                  <td>
                    <div className="table-preview-thumb">
                      <div className="table-preview-scale">
                        {renderTemplateByType(t.template, previewData, t.color, t.font)}
                      </div>
                    </div>
                  </td>

                  <td style={{ textTransform: "capitalize" }}>
                    {t.pricing}
                  </td>

                  <td>
                    {t.pricing === "paid" ? `₹${t.price}` : "₹0"}
                  </td>

                  <td style={{ textTransform: "capitalize" }}>
                    {t.status}
                  </td>

                  <td>
                    <div className="action-btn-group">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditModal(t)}
                        title="Edit"
                      >
                        ✏ Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(t)}
                        title="Delete"
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
      )
      }
            {showModal && (
        <div className="template-modal-overlay">
          <div className="template-modal-box">

            <button
              className="close-btn"
              onClick={closeModal}
            >
              ✖
            </button>

            <h2>{editingId ? "Edit Template" : "Add New Template"}</h2>

            <form onSubmit={handleSave}>

              <label className="field-label">
                Template Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter template name"
                value={formData.name}
                onChange={handleChange}
              />

              <div className="template-preview-section">

                {/* LEFT */}

                <div className="template-picker">

                  <label className="field-label">
                    Pick up Template
                  </label>

                  <select
                    name="template"
                    value={formData.template}
                    onChange={handleTemplateSelect}
                  >
                    <optgroup label="Base Layouts">
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                      <option value="corporate">Corporate</option>
                      <option value="minimal">Minimal</option>
                      <option value="premium">Premium</option>
                    </optgroup>

                    {templates.length > 0 && (
                      <optgroup label="Your Templates">
                        {templates.map((t) => (
                          <option key={t.id} value={`existing:${t.id}`}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <label className="field-label" style={{ marginTop: 16 }}>
                    Font
                  </label>

                  <select
                    name="font"
                    value={formData.font}
                    onChange={handleChange}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <label className="field-label" style={{ marginTop: 16 }}>
                    Accent Color
                  </label>

                  <input
                    type="color"
                    name="color"
                    className="color-input"
                    value={formData.color}
                    onChange={handleChange}
                  />

                </div>

                {/* RIGHT */}

                <div className="template-preview-box">

                  <label className="field-label">
                    Preview
                  </label>

                  <div className="preview-container">
                    <div className="preview-scale">
                      {renderPreview()}
                    </div>
                  </div>

                </div>

              </div>

              <label className="field-label">
                Pricing
              </label>

              <div className="radio-row">

                <label className="radio-option">
                  <input
                    type="radio"
                    name="pricing"
                    value="free"
                    checked={formData.pricing === "free"}
                    onChange={handleChange}
                  />
                  Free
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="pricing"
                    value="paid"
                    checked={formData.pricing === "paid"}
                    onChange={handleChange}
                  />
                  Paid
                </label>

              </div>

              {formData.pricing === "paid" && (

                <input
                  type="number"
                  name="price"
                  placeholder="Enter Price"
                  value={formData.price}
                  onChange={handleChange}
                />

              )}

              <label className="field-label">
                Status
              </label>

              <div className="radio-row">

                <label className="radio-option">

                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleChange}
                  />

                  Active

                </label>

                <label className="radio-option">

                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={handleChange}
                  />

                  Inactive

                </label>

              </div>

              <button
                className="save-template-btn"
                type="submit"
              >
                {editingId ? "Update Template" : "Save Template"}
              </button>

            </form>

          </div>
        </div>
      )}


    </div>
  );
}
