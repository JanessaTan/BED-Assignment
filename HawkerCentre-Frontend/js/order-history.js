document.addEventListener("DOMContentLoaded", function initialiseOrderHistory() {
  if (!HC.initPage("history", ["customer", "guest"])) return;

  function render() {
    const search = document.getElementById("orderSearch").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const date = document.getElementById("dateFilter").value;
    const orders = HC.getVisibleOrders().filter((order) => {
      const matchesId = order.id.toLowerCase().includes(search);
      const matchesStatus = !status || order.status === status;
      const matchesDate = !date || order.createdAt.slice(0, 10) === date;
      return matchesId && matchesStatus && matchesDate;
    });

    document.getElementById("historyCount").textContent = `${orders.length} order${orders.length === 1 ? "" : "s"} found`;
    document.getElementById("historyEmpty").hidden = orders.length > 0;
    document.getElementById("historyResults").innerHTML = orders.map((order) => `
      <article class="card history-card" data-order="${order.id}">
        <div><div class="row-between"><h2>${HC.escapeHtml(order.id)}</h2><span class="badge ${order.status === "Completed" ? "badge-success" : "badge-info"}">${HC.escapeHtml(order.status)}</span></div><p class="history-items">${order.items.map((item) => `${item.quantity} × ${HC.escapeHtml(item.name)}`).join(" · ")}</p><p class="muted">${HC.formatDate(order.createdAt, true)} · ${HC.formatCurrency(order.total)}</p></div>
        <div class="card-actions"><a class="btn btn-primary" href="order.html?order=${encodeURIComponent(order.id)}">View details</a><button class="btn btn-outline" type="button" data-reorder="${order.id}">Reorder</button></div>
      </article>`).join("");
  }

  ["orderSearch", "statusFilter", "dateFilter"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "orderSearch" ? "input" : "change", render);
  });

  document.getElementById("historyResults").addEventListener("click", function reorder(event) {
    const orderId = event.target.closest("[data-reorder]")?.dataset.reorder;
    if (!orderId) return;
    const order = HC.getVisibleOrders().find((candidate) => candidate.id === orderId);
    if (!order) return;
    const currentCart = HC.getCart();
    const reorderedLines = order.items.map((item) => ({
      ...item,
      cartLineId: `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }));
    HC.saveCart([...currentCart, ...reorderedLines]);
    HC.showToast("Items added back to your cart.");
    window.setTimeout(() => { window.location.href = "cart.html"; }, 450);
  });
  render();
});
