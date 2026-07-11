import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE } from "../config";
import "./Products.css";

export default function Products() {
  const shopUser = JSON.parse(localStorage.getItem("shopUser") || "null");
  const shopId = shopUser?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [formName, setFormName] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(`${API_BASE}/products`, {
        params: { shop_id: shopId },
      });
      setProducts(res.data);
    } catch (err) {
      setLoadError("Could not load products. Check that the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const openAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormDetails("");
    setFormPrice("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormDetails(product.details);
    setFormPrice(String(product.price));
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Product name is required.");
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Please enter a valid price.");
      return;
    }
    if (!shopId) {
      setFormError("Couldn't identify your shop. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/products/${editingId}`, {
          name: formName.trim(),
          details: formDetails.trim(),
          price: priceNum,
        });
      } else {
        await axios.post(`${API_BASE}/products`, {
          shop_id: shopId,
          name: formName.trim(),
          details: formDetails.trim(),
          price: priceNum,
        });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(
        err?.response?.data?.detail || "Something went wrong saving this product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/products/${product.id}`);
      fetchProducts();
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not delete this product.");
    }
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Products</h1>
        <button type="button" className="products-add-btn" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <p className="products-empty">Loading products...</p>
      ) : loadError ? (
        <p className="products-empty">{loadError}</p>
      ) : products.length === 0 ? (
        <p className="products-empty">
          No products yet. Click "+ Add Product" to create your first one.
        </p>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Details</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="products-details-cell">{p.details || "—"}</td>
                  <td>₹{Number(p.price).toFixed(2)}</td>
                  <td className="products-actions-cell">
                    <button
                      type="button"
                      className="products-edit-btn"
                      onClick={() => openEditModal(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="products-delete-btn"
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal &&
        createPortal(
          <div className="products-overlay" onClick={() => setShowModal(false)}>
            <div className="products-modal-box" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="products-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>

              <div className="products-modal-header">
                <h2>{editingId ? "Edit Product" : "Add Product"}</h2>
              </div>

              <form onSubmit={handleSave}>
                <label className="field-label">Product Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />

                <label className="field-label">Product Details</label>
                <input
                  type="text"
                  placeholder="e.g. size, material, description"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                />

                <label className="field-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />

                {formError && <p className="products-form-error">{formError}</p>}

                <div className="products-modal-actions">
                  <button
                    type="button"
                    className="products-modal-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="products-modal-save" disabled={saving}>
                    {saving ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}