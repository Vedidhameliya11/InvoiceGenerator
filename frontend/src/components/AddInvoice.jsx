import axios from "axios";
import { API_BASE } from "../config";
import { useEffect, useState } from "react";

import ClassicPreview from "./ClassicPreview";
import ModernPreview from "./ModernPreview";
import CorporatePreview from "./CorporatePreview";
import MinimalPreview from "./MinimalPreview";
import PremiumPreview from "./PremiumPreview";


const FONT_CSS = {
  Helvetica: "Helvetica, Arial, sans-serif",
  "Times-Roman": '"Times New Roman", Times, serif',
  Courier: '"Courier New", Courier, monospace',
};

const fontCss = (value) => FONT_CSS[value] || FONT_CSS.Helvetica;

export default function AddInvoice() {
  const [showPreview, setShowPreview] = useState(false);

  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [formData, setFormData] = useState({
    organizationName: "",
    customerName: "",
    productName: "",
    productPrice: "",
    productQuantity: "",
    template: "",
    font: "Helvetica",
    color: "#2563eb",
  });

  // Pull templates created in the Templates section, showing only the
  // free + active ones here (paid templates are excluded from Add Invoice).
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${API_BASE}/templates`);

        const freeActive = res.data.filter(
          (t) => t.pricing === "free" && t.status === "active"
        );

        setAvailableTemplates(freeActive);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // 🔥 Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setShowPreview(false);
  };

  // Picking a template radio pulls in that specific template's
  // layout + font + color, not just the base layout name.
  const handleTemplatePick = (t) => {
    setFormData((prev) => ({
      ...prev,
      template: t.template,
      font: t.font || "Helvetica",
      color: t.color || "#2563eb",
    }));

    setShowPreview(false);
  };

  // Save a record of this invoice so it shows up under History
  const saveToHistory = (data) => {
    const existing = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

    const record = {
      ...data,
      id: Date.now(),
      generatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "invoiceHistory",
      JSON.stringify([record, ...existing])
    );
  };

  // 🔥 Generate PDF
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE}/generate-pdf`,
        formData,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");

      document.body.appendChild(link);
      link.click();
      link.remove();

      saveToHistory(formData);
    } catch (error) {
      alert("Something went wrong!");
    }
  };

  const previewComponents = {
    classic: ClassicPreview,
    modern: ModernPreview,
    corporate: CorporatePreview,
    minimal: MinimalPreview,
    premium: PremiumPreview,
  };

  const SelectedPreview =
    previewComponents[formData.template] || ClassicPreview;

  return (
    <div className="container">
      <h1>Invoice Generator</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="organizationName"
          placeholder="Organization Name"
          value={formData.organizationName}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          value={formData.customerName}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="productName"
          placeholder="Product Name"
          value={formData.productName}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="productPrice"
          placeholder="Product Price"
          value={formData.productPrice}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="productQuantity"
          placeholder="Product Quantity"
          value={formData.productQuantity}
          onChange={handleChange}
          required
        />

        {/* TEMPLATE */}
        <div className="template-section">
          <h3>Select Invoice Template</h3>

          {loadingTemplates ? (
            <p>Loading templates...</p>
          ) : availableTemplates.length === 0 ? (
            <p>No free templates available yet. Add one from the Templates section.</p>
          ) : (
            availableTemplates.map((t) => (
              <label key={t.id}>
                <input
                  type="radio"
                  name="template"
                  value={t.template}
                  checked={formData.template === t.template && formData.color === (t.color || "#2563eb")}
                  onChange={() => handleTemplatePick(t)}
                />
                {t.name}
              </label>
            ))
          )}
        </div>

        {/* PREVIEW */}
        {formData.template && (
          <button
            type="button"
            className="preview-btn"
            onClick={() => setShowPreview(true)}
          >
            Preview Template
          </button>
        )}

        <button type="submit">Generate PDF</button>
      </form>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="preview-wrapper">
          <div className="preview-box">
            <button
              className="close-btn"
              onClick={() => setShowPreview(false)}
            >
              ✖
            </button>

            <SelectedPreview
              data={formData}
              color={formData.color}
              font={fontCss(formData.font)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
