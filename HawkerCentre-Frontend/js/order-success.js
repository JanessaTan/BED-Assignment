document.addEventListener("DOMContentLoaded", function initialiseOrderResult() {
  if (!HC.initPage("history", ["customer", "guest"])) return;
  const orderId = HC.getQueryParameter("order");
  const target = document.getElementById("successCard");
  try{
    const response = await fetch(`/api/checkout/${orderId}`);
    const orders = await response.json();
    if(!orders.length){
      throw new Error("Order not found");
    }
    const order = orders[0];
target.innerHTML = `
            <div class="success-icon">✓</div>
            <span class="eyebrow">Order confirmed</span>
            <h1>Your order has been placed.</h1>
            <p>The food stalls have received your order.</p>
            <div class="card"><p><strong>Order ID</strong><br>${HC.escapeHtml(order.OrderID)}</p>
            <p><strong>Payment</strong><br>${HC.escapeHtml(order.PmtType)}</p>
            <h3>Items</h3>${orders.map(item => `<p>${item.Quantity}×${HC.escapeHtml(item.ItemCode)}-${HC.formatCurrency(item.UnitPrice)}</p>`).join("")}
            </div>

            <div class="hero-actions">
            <a class="btn btn-primary" href="order.html?order=${order.OrderID}">
            Track order
            </a>
                <a class="btn btn-muted" href="order-history.html">
                Order history
                </a>
            </div>
        `;

    }catch(error){
        console.error(error);
        target.innerHTML = `
            <h1>
            Order unavailable
            </h1>

            <p>
            Could not retrieve order details.
            </p>
        `;
    }
});
