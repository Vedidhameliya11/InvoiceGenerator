import { useEffect, useState } from "react";
import "./History.css";

export default function History() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    setInvoices(stored);
  }, []);

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
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Template</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.organizationName}</td>
                  <td>{inv.customerName}</td>
                  <td>{inv.productName}</td>
                  <td>{inv.productPrice}</td>
                  <td>{inv.productQuantity}</td>
                  <td className="template-cell">{inv.template}</td>
                  <td>{new Date(inv.generatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}