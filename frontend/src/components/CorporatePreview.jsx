function CorporatePreview({ data, color, font }) {
  const total =
    (Number(data.productPrice) || 0) *
    (Number(data.productQuantity) || 0);

  const style = {
    "--tpl-color": color || "#374151",
    "--tpl-font": font || "inherit",
  };

  return (
    <div className="preview corporate" style={style}>

      <div className="corporate-header">
        <h2>CORPORATE INVOICE</h2>
      </div>

      <div className="corporate-body">

        <div className="info">
          <div>
            <h4>Organization</h4>
            <p>{data.organizationName}</p>
          </div>

          <div>
            <h4>Customer</h4>
            <p>{data.customerName}</p>
          </div>
        </div>

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

    </div>
  );
}

export default CorporatePreview;
