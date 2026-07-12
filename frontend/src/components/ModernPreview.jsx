function ModernPreview({ data, color, font }) {

  const items = data.items || [];
  const total = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );

  const style = {
    "--tpl-color": color || "#2563eb",
    "--tpl-font": font || "inherit",
  };

  return (
    <div className="preview modern" style={style}>

      <div className="modern-header">
        <h2>MODERN INVOICE</h2>
      </div>

      <div className="modern-body">

        <p><strong>Organization</strong></p>
        <p>{data.organizationName}</p>

        <p><strong>Customer</strong></p>
        <p>{data.customerName}</p>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.name}</td>
                <td>₹{it.price}</td>
                <td>{it.quantity}</td>
                <td>₹{(Number(it.price) || 0) * (Number(it.quantity) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Grand Total : ₹ {total}</h3>

      </div>

    </div>
  );
}

export default ModernPreview;