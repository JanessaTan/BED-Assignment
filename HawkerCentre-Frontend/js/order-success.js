document.addEventListener("DOMContentLoaded", async function initialiseOrderResult() {
  "use strict";

  if (!HC.initPage("history", ["customer"])) return;

  const orderId = HC.getQueryParameter("order") || sessionStorage.getItem("hc.latestOrder");
  const target = document.getElementById("successCard");

  if (!target) return;

  if (!orderId) {
    target.innerHTML = "<h1>Order unavailable</h1><p>No order ID was provided.</p>";
    return;
  }

  try {
    const response = await HC.apiRequest(`/checkout/${encodeURIComponent(orderId)}`, {
      method: "GET"
    });
    const orders = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    if (!orders.length) throw new Error("Order not found.");

    const order = orders[0];
    target.innerHTML = `
      <div class="success-icon">✓</div>
      <span class="eyebrow">Order confirmed</span>
      <h1>Your order has been placed.</h1>
      <p>The food stalls have received your order.</p>
      <div class="card">
        <p><strong>Order ID</strong><br>${HC.escapeHtml(order.OrderID)}</p>
        <p><strong>Payment</strong><br>${HC.escapeHtml(order.PmtType)}</p>
        ${order.PickupTime ? `<p><strong>Pickup time</strong><br>${HC.escapeHtml(new Date(order.PickupTime).toLocaleString("en-SG"))}</p>` : ""}
        <h3>Items</h3>
        ${orders.map((item) => `
          <p>${Number(item.Quantity)} × ${HC.escapeHtml(item.ItemName || item.ItemCode)} — ${HC.formatCurrency(Number(item.UnitPrice) * Number(item.Quantity))}</p>
        `).join("")}
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary" href="order.html?order=${encodeURIComponent(order.OrderID)}">Track order</a>
        <a class="btn btn-muted" href="order-history.html">Order history</a>
      </div>`;
  } catch (error) {
    console.error("Unable to retrieve order:", error);
    target.innerHTML = `
      <h1>Order unavailable</h1>
      <p>${HC.escapeHtml(error.message || "Could not retrieve order details.")}</p>`;
  }
});
