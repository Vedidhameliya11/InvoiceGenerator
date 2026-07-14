function ClassicPreview({ data, color, font }) {

  const items = data.items || [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );
  const gstPercent = Number(data.gstPercent) || 0;
  const gstAmount = (subtotal * gstPercent) / 100;
  const total = subtotal + gstAmount;

  const style = {
    "--tpl-color": color || "#111827",
    "--tpl-font": font || "inherit",
  };

  return (
    <div className="preview classic" style={style}>

      <h2>INVOICE</h2>

      <hr />

      <p><strong>Organization:</strong> {data.organizationName}</p>
      <p><strong>Customer:</strong> {data.customerName}</p>

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

      <p>Subtotal : ₹{subtotal.toFixed(2)}</p>
      <p>GST ({gstPercent}%) : ₹{gstAmount.toFixed(2)}</p>
      <h3>Grand Total : ₹{total.toFixed(2)}</h3>

    </div>
  );
}

export default ClassicPreview;