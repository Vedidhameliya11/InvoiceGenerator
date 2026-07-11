function ClassicPreview({ data, color, font }) {

  const items = data.items || [];
  const total = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );

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

      <h3>Grand Total : ₹{total}</h3>

    </div>
  );
}

export default ClassicPreview;