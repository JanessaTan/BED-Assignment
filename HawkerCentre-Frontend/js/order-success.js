document.addEventListener("DOMContentLoaded", function initialiseOrderResult() {
  if (!HC.initPage("history", ["customer", "guest"])) return;
  const orderId = HC.getQueryParameter("order") || sessionStorage.getItem("hc.latestOrder");
  const order = HC.loadData(HC.KEYS.orders, []).find((candidate) => candidate.id === orderId);
  const target = document.getElementById("successCard");

  if (!order) {
    target.innerHTML = `<div class="success-icon" aria-hidden="true">!</div><h1>Order details unavailable</h1><p>We could not find the latest demonstration order in this browser.</p><a class="btn btn-primary" href="order-history.html">View order history</a>`;
    return;
  }

  const successful = order.paymentStatus === "Successful";
  target.innerHTML = `
    <div class="success-icon" style="${successful ? "" : "background:var(--danger)"}" aria-hidden="true">${successful ? "✓" : "!"}</div>
    <span class="eyebrow">${successful ? "Order confirmed" : "Payment unsuccessful"}</span>
    <h1>${successful ? "Your order has been placed." : "Your order could not be completed."}</h1>
    <p>${successful ? "The food stalls have received your demonstration order." : "No payment was processed. Return to checkout to try again."}</p>
    <div class="card"><p><strong>Order ID</strong><br>${HC.escapeHtml(order.id)}</p><p><strong>Total</strong><br>${HC.formatCurrency(order.total)}</p><p><strong>Payment</strong><br>${HC.escapeHtml(order.paymentMethod)} · ${HC.escapeHtml(order.paymentStatus)}</p></div>
    <div class="hero-actions"><a class="btn btn-primary" href="order.html?order=${encodeURIComponent(order.id)}">Track order</a><a class="btn btn-muted" href="order-history.html">Order history</a></div>`;
});
