function PremiumPreview({ data, color, font }) {

  const total =
    (Number(data.productPrice) || 0) *
    (Number(data.productQuantity) || 0);

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
            <tr>
              <td>{data.productName}</td>
              <td>₹{data.productPrice}</td>
              <td>{data.productQuantity}</td>
              <td>₹{total}</td>
            </tr>
          </tbody>
        </table>

        <h2>Grand Total : ₹{total}</h2>

      </div>

    </div>
  );
}

export default PremiumPreview;
