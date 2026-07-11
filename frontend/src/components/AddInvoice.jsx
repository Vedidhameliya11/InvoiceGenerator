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

const emptyItem = () => ({ name: "", price: "", quantity: "" });

export default function AddInvoice() {
  const [showPreview, setShowPreview] = useState(false);

  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [formData, setFormData] = useState({
    organizationName: "",
    customerName: "",
    items: [emptyItem()],
    template: "",
    font: "Helvetica",
    color: "#2563eb",
  });

  // Customer lookup: does this customer name already exist for this shop?
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerContactNo, setCustomerContactNo] = useState("");
  const [customerFound, setCustomerFound] = useState(false);
  const [customerChecked, setCustomerChecked] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(false);

  // "+ Add New Customer" popup
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState("");

  // Product catalog (from the Products page) — used to suggest names and
  // auto-fill price when a shop owner types an existing product's name.
  const [catalogProducts, setCatalogProducts] = useState([]);

  const shopUser = JSON.parse(localStorage.getItem("shopUser") || "null");
  const shopId = shopUser?.id;

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!shopId) return;
      try {
        const res = await axios.get(`${API_BASE}/products`, {
          params: { shop_id: shopId },
        });
        setCatalogProducts(res.data);
      } catch (err) {
        console.error("Failed to load product catalog:", err);
      }
    };
    fetchCatalog();
  }, [shopId]);

  // Debounced lookup: whenever the typed customer name settles, ask the
  // backend if a customer with that name already exists for this shop.
  useEffect(() => {
    const name = formData.customerName.trim();

    if (!name || !shopId) {
      setCustomerFound(false);
      setCustomerChecked(false);
      setCustomerAddress("");
      setCustomerContactNo("");
      return;
    }

    setCheckingCustomer(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/customers/lookup`, {
          params: { shop_id: shopId, name },
        });

        if (res.data.found) {
          setCustomerFound(true);
          setCustomerAddress(res.data.customer.address || "");
          setCustomerContactNo(res.data.customer.contact_no || "");
        } else {
          setCustomerFound(false);
          setCustomerAddress("");
          setCustomerContactNo("");
        }
        setCustomerChecked(true);
      } catch (err) {
        console.error("Customer lookup failed:", err);
        setCustomerChecked(false);
      } finally {
        setCheckingCustomer(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.customerName, shopId]);

  const openAddCustomer = () => {
    setNewCustomerAddress("");
    setNewCustomerContact("");
    setAddCustomerError("");
    setShowAddCustomer(true);
  };

  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    setAddCustomerError("");

    const name = formData.customerName.trim();
    if (!name) {
      setAddCustomerError("Customer name can't be empty.");
      return;
    }
    if (!shopId) {
      setAddCustomerError("Couldn't identify your shop. Please log in again.");
      return;
    }

    setSavingCustomer(true);
    try {
      const res = await axios.post(`${API_BASE}/customers`, {
        shop_id: shopId,
        name,
        address: newCustomerAddress.trim(),
        contact_no: newCustomerContact.trim(),
      });

      setCustomerAddress(res.data.address || "");
      setCustomerContactNo(res.data.contact_no || "");
      setCustomerFound(true);
      setCustomerChecked(true);
      setShowAddCustomer(false);
    } catch (err) {
      setAddCustomerError(
        err?.response?.data?.detail || "Something went wrong saving this customer."
      );
    } finally {
      setSavingCustomer(false);
    }
  };

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

  // 🔥 Handle top-level input changes (organization / customer name)
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setShowPreview(false);
  };

  // Update a single field of a single product row
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const current = { ...items[index], [field]: value };

      // If they just typed/selected a product name that exactly matches
      // something in the catalog, and price is still empty, auto-fill it.
      if (field === "name") {
        const match = catalogProducts.find(
          (p) => p.name.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (match && !current.price) {
          current.price = String(match.price);
        }
      }

      items[index] = current;
      return { ...prev, items };
    });
    setShowPreview(false);
  };

  const addItemRow = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
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
  const saveToHistory = (data, grandTotal) => {
    const existing = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

    const record = {
      ...data,
      grandTotal,
      id: Date.now(),
      generatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "invoiceHistory",
      JSON.stringify([record, ...existing])
    );
  };

  const grandTotal = formData.items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );

  // 🔥 Generate PDF
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanItems = formData.items
      .map((it) => ({
        name: it.name.trim(),
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 0,
      }))
      .filter((it) => it.name);

    if (cleanItems.length === 0) {
      alert("Please add at least one product with a name.");
      return;
    }

    const payload = {
      organizationName: formData.organizationName,
      customerName: formData.customerName,
      items: cleanItems,
      template: formData.template,
      font: formData.font,
      color: formData.color,
    };

    try {
      const response = await axios.post(
        `${API_BASE}/generate-pdf`,
        payload,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");

      document.body.appendChild(link);
      link.click();
      link.remove();

      const total = cleanItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      saveToHistory(payload, total);
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

      <datalist id="catalog-product-names">
        {catalogProducts.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>

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

        {formData.customerName.trim() && (
          <div className="customer-status">
            {checkingCustomer && (
              <p className="customer-checking">Checking existing customers…</p>
            )}

            {!checkingCustomer && customerChecked && customerFound && (
              <div className="customer-found">
                <p>✅ Existing customer — details auto-filled</p>
                <p className="customer-detail">
                  <strong>Address:</strong> {customerAddress || "—"}
                </p>
                <p className="customer-detail">
                  <strong>Contact:</strong> {customerContactNo || "—"}
                </p>
              </div>
            )}

            {!checkingCustomer && customerChecked && !customerFound && (
              <button
                type="button"
                className="add-customer-btn"
                onClick={openAddCustomer}
              >
                + Add New Customer
              </button>
            )}
          </div>
        )}

        {/* MULTIPLE PRODUCTS */}
        <div className="items-section">
          <h3>Products</h3>

          {formData.items.map((item, index) => {
            const lineTotal =
              (Number(item.price) || 0) * (Number(item.quantity) || 0);

            return (
              <div className="item-row" key={index}>
                <input
                  type="text"
                  placeholder="Product Name"
                  list="catalog-product-names"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) =>
                    handleItemChange(index, "price", e.target.value)
                  }
                  required
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  required
                />

                <span className="item-row-total">₹{lineTotal.toFixed(2)}</span>

                <button
                  type="button"
                  className="item-remove-btn"
                  onClick={() => removeItemRow(index)}
                  disabled={formData.items.length === 1}
                  title={
                    formData.items.length === 1
                      ? "At least one product is required"
                      : "Remove this product"
                  }
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button type="button" className="add-item-btn" onClick={addItemRow}>
            + Add Another Product
          </button>

          <div className="items-grand-total">
            Grand Total: ₹{grandTotal.toFixed(2)}
          </div>
        </div>

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

      {/* ADD NEW CUSTOMER MODAL */}
      {showAddCustomer && (
        <div className="preview-wrapper">
          <div className="add-customer-box">
            <div className="add-customer-header">
              <h3>Add New Customer</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowAddCustomer(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer}>
              <label className="field-label">Customer Name</label>
              <input type="text" value={formData.customerName} disabled />

              <label className="field-label">Address</label>
              <input
                type="text"
                placeholder="Customer Address"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
              />

              <label className="field-label">Contact No.</label>
              <input
                type="text"
                placeholder="Customer Contact Number"
                value={newCustomerContact}
                onChange={(e) => setNewCustomerContact(e.target.value)}
              />

              {addCustomerError && (
                <p className="add-customer-error">{addCustomerError}</p>
              )}

              <div className="add-customer-actions">
                <button
                  type="button"
                  className="add-customer-cancel"
                  onClick={() => setShowAddCustomer(false)}
                  disabled={savingCustomer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-customer-save"
                  disabled={savingCustomer}
                >
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}