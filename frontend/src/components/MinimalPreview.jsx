function MinimalPreview({ data, color, font }) {

  const items = data.items || [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );
  const gstPercent = Number(data.gstPercent) || 0;
  const gstAmount = (subtotal * gstPercent) / 100;
  const total = subtotal + gstAmount;

  const style = {
    "--tpl-color": color || "#000000",
    "--tpl-font": font || "inherit",
  };

  return (
    <div className="preview minimal" style={style}>

      <h1>Invoice</h1>

      <p>Organization : {data.organizationName}</p>

      <p>Customer : {data.customerName}</p>

      <hr />

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

      <hr />

      <p>Subtotal : ₹{subtotal.toFixed(2)}</p>
      <p>GST ({gstPercent}%) : ₹{gstAmount.toFixed(2)}</p>
      <h2>Total : ₹{total.toFixed(2)}</h2>

    </div>
  );
}

export default MinimalPreview;