function PremiumPreview({ data, color, font }) {
  const items = data.items || [];
  const total = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );

  const style = {
    "--tpl-color": color || "#b8860b",
    "--tpl-font": font || "inherit",
  };

  return (
    <div className="preview premium" style={style}>

      <div className="premium-header">
        <h1>PREMIUM INVOICE</h1>
      </div>

      <div className="premium-body">

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

        <h2>Grand Total : ₹{total}</h2>

      </div>

    </div>
  );
}

export default PremiumPreview;