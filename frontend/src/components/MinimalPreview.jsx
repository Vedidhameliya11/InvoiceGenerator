function MinimalPreview({ data, color, font }) {

  const total =
    (Number(data.productPrice) || 0) *
    (Number(data.productQuantity) || 0);

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

      <p>Product : {data.productName}</p>

      <p>Price : ₹{data.productPrice}</p>

      <p>Quantity : {data.productQuantity}</p>

      <hr />

      <h2>Total : ₹{total}</h2>

    </div>
  );
}

export default MinimalPreview;
