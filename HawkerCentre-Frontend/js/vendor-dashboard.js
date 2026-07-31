document.addEventListener("DOMContentLoaded", function initialiseVendorDashboard() {
  if (!HC.initPage("dashboard", ["vendor"])) return;
  const user = HC.getCurrentUser();
  const stall = HC.getStallById(user.stallId || "clementi-chicken-rice");
  const orders = HC.getVisibleOrders();
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const feedback = HC.loadData(HC.KEYS.feedback, []).filter((review) => review.stallId === stall.id);
  const averageRating = feedback.length ? feedback.reduce((sum, review) => sum + review.rating, 0) / feedback.length : stall.rating;
  const pending = orders.filter((order) => order.status !== "Completed");
  const promotion = stall.promotionId ? HC.getPromotionById(stall.promotionId) : null;

  document.getElementById("vendorWelcome").textContent = `Welcome back, ${user.name}.`;
  const currentGrade = HC.getCurrentHygieneRecord(stall.id)?.grade || stall.hygiene;
  document.getElementById("dashboardHygiene").textContent = HC.hygieneText(currentGrade);
  document.getElementById("vendorStats").innerHTML = [
    ["Total orders", orders.length],
    ["Revenue", HC.formatCurrency(revenue)],
    ["Average rating", `${averageRating.toFixed(1)} / 5`],
    ["Active promotions", promotion && HC.isPromotionActive(promotion) ? 1 : 0]
  ].map(([label, value]) => `<article class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></article>`).join("");

  document.getElementById("pendingOrders").innerHTML = pending.length
    ? pending.map((order) => `<article class="notice notice-info"><div class="row-between"><strong>${HC.escapeHtml(order.id)}</strong><span>${HC.escapeHtml(order.status)}</span></div><p>${order.items.length} item lines · ${HC.formatCurrency(order.total)}</p><a href="order.html?order=${encodeURIComponent(order.id)}">Manage order</a></article>`).join("")
    : '<div class="empty-state"><h3>No pending orders</h3><p>New demonstration orders will appear here.</p></div>';

  const counts = {};
  orders.flatMap((order) => order.items).forEach((item) => {
    counts[item.name] = (counts[item.name] || 0) + item.quantity;
  });
  const popular = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  document.getElementById("popularItems").innerHTML = popular.length
    ? popular.map(([name, count], index) => `<div class="row-between"><span>${index + 1}. ${HC.escapeHtml(name)}</span><strong>${count} sold</strong></div>`).join("")
    : '<p class="muted">Order data will reveal popular items.</p>';

  const actions = [
    ["Edit menu", "menu-management.html", "Add or update dishes."],
    ["Manage orders", "order.html", "Move preparation status."],
    ["Rental agreement", "rental-agreement.html", "Review renewal details."],
    ["Sales analytics", "sales-analytics.html", "Explore performance trends."]
  ];
  document.getElementById("vendorActions").innerHTML = actions.map(([title, href, text]) => `<a class="card quick-card" href="${href}"><h3>${title}</h3><p>${text}</p></a>`).join("");
});
