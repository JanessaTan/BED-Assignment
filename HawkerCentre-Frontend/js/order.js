document.addEventListener("DOMContentLoaded", function initialiseOrderTracking() {
  const currentUser = HC.getCurrentUser();
  const roles = currentUser?.role === "vendor" ? ["vendor"] : ["customer", "guest"];
  if (!HC.initPage(currentUser?.role === "vendor" ? "orders" : "history", roles)) return;

  const statusSteps = ["Order received", "Preparing", "Ready for collection", "Completed"];
  const orderId = HC.getQueryParameter("order") || HC.getVisibleOrders()[0]?.id;
  let orders = HC.loadData(HC.KEYS.orders, []);
  let order = HC.getVisibleOrders().find((candidate) => candidate.id === orderId);
  const details = document.getElementById("orderDetails");
  const missing = document.getElementById("orderMissing");

  function render() {
    if (!order) {
      details.hidden = true;
      missing.hidden = false;
      return;
    }
    const currentIndex = Math.max(0, statusSteps.indexOf(order.status));
    const stallNames = [...new Set(order.items.map((item) => HC.getStallById(item.stallId)?.name || "Food stall"))];
    const estimate = order.status === "Completed" ? "Collected" : `${Math.max(2, 18 - currentIndex * 5)} minutes`;
    details.hidden = false;
    missing.hidden = true;
    details.innerHTML = `
      <div class="order-header"><div><span class="eyebrow">Order ${HC.escapeHtml(order.id)}</span><h2>${stallNames.map(HC.escapeHtml).join(", ")}</h2><p class="muted">Placed ${HC.formatDate(order.createdAt, true)}</p></div><span class="badge ${order.status === "Completed" ? "badge-success" : "badge-info"}">${HC.escapeHtml(order.status)}</span></div>
      <div class="status-tracker" aria-label="Order progress">${statusSteps.map((step, index) => `<div class="status-step ${index <= currentIndex ? "complete" : ""}">${index + 1}. ${step}</div>`).join("")}</div>
      <div class="grid grid-2"><div><h3>Items</h3>${order.items.map((item) => `<p>${item.quantity} × ${HC.escapeHtml(item.name)}</p>`).join("")}</div><div><h3>Estimated collection</h3><p class="price">${estimate}</p><p>Total: ${HC.formatCurrency(order.total)}</p></div></div>
      <div class="card-actions"><button class="btn btn-primary" id="nextStatus" type="button" ${currentIndex === statusSteps.length - 1 ? "disabled" : ""}>Simulate next status</button><a class="btn btn-muted" href="order-history.html">Back to history</a></div>`;
    document.getElementById("nextStatus")?.addEventListener("click", advanceStatus);
  }

  function advanceStatus() {
    const currentIndex = Math.max(0, statusSteps.indexOf(order.status));
    if (currentIndex >= statusSteps.length - 1) return;
    order.status = statusSteps[currentIndex + 1];
    orders = orders.map((candidate) => candidate.id === order.id ? order : candidate);
    HC.saveData(HC.KEYS.orders, orders);
    HC.showToast(`Order moved to: ${order.status}`);
    render();
  }

  render();
});
