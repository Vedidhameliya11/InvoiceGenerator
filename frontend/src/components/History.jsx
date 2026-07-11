import { useEffect, useState } from "react";
import "./History.css";

export default function History() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    setInvoices(stored);
  }, []);

  // Older history records (before multiple products were supported) had
  // productName/productPrice/productQuantity directly on the record
  // instead of an `items` array — normalize both shapes here.
  const getItems = (inv) => {
    if (inv.items && inv.items.length) return inv.items;
    if (inv.productName) {
      return [
        {
          name: inv.productName,
          price: inv.productPrice,
          quantity: inv.productQuantity,
        },
      ];
    }
    return [];
  };

  const getTotal = (inv) => {
    if (typeof inv.grandTotal === "number") return inv.grandTotal;
    return getItems(inv).reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
      0
    );
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Invoice History</h1>
      </div>

      {invoices.length === 0 ? (
        <p className="history-empty">
          No invoices generated yet. Create one from "Add Invoice".
        </p>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Grand Total</th>
                <th>Template</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const items = getItems(inv);
                return (
                  <tr key={inv.id}>
                    <td>{inv.organizationName}</td>
                    <td>{inv.customerName}</td>
                    <td className="history-products-cell">
                      {items.map((it, i) => (
                        <div key={i}>
                          {it.name} × {it.quantity} @ ₹{it.price}
                        </div>
                      ))}
                    </td>
                    <td>₹{getTotal(inv).toFixed(2)}</td>
                    <td className="template-cell">{inv.template}</td>
                    <td>{new Date(inv.generatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}