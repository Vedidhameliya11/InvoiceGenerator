function ModernPreview({ data, color, font }) {

  const total =
    (Number(data.productPrice) || 0) *
    (Number(data.productQuantity) || 0);

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
            <tr>
              <td>{data.productName}</td>
              <td>₹{data.productPrice}</td>
              <td>{data.productQuantity}</td>
              <td>₹{total}</td>
            </tr>
          </tbody>
        </table>

        <h3>₹ {total}</h3>

      </div>

    </div>
  );
}

export default ModernPreview;
