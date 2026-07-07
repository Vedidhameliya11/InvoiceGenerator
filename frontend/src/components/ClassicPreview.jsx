function ClassicPreview({ data, color, font }) {

  const total =
    (Number(data.productPrice) || 0) *
    (Number(data.productQuantity) || 0);

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
          <tr>
            <td>{data.productName}</td>
            <td>₹{data.productPrice}</td>
            <td>{data.productQuantity}</td>
            <td>₹{total}</td>
          </tr>
        </tbody>
      </table>

      <h3>Grand Total : ₹{total}</h3>

    </div>
  );
}

export default ClassicPreview;
