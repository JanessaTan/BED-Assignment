document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("dashboard", ["vendor"])) return;

  const user = HC.getCurrentUser();
  document.getElementById("vendorWelcome").textContent = `Welcome back, ${user.fullName || user.name}.`;
  document.getElementById("pendingOrders").innerHTML = '<p class="muted">Loading management information...</p>';

  try {
    const stallResponse = await apiGet("/stalls/mine");
    const stalls = stallResponse?.data || [];
    const selectedStall = stalls[0] || null;
    let menuItems = [];
    let promotions = [];

    if (selectedStall) {
      const [menuResponse, promotionResponse] = await Promise.all([
        apiGet(`/menu-items?stallId=${selectedStall.stallId}&limit=100`),
        apiGet(`/promotions?stallId=${selectedStall.stallId}&limit=100`)
      ]);
      menuItems = menuResponse?.data || [];
      promotions = promotionResponse?.data || [];
    }

    document.getElementById("dashboardHygiene").textContent = selectedStall?.hygieneGrade
      ? HC.hygieneText(selectedStall.hygieneGrade)
      : "Hygiene grade unavailable";
    document.getElementById("vendorStats").innerHTML = [
      ["Managed stalls", stalls.length],
      ["Menu items", menuItems.length],
      ["Available items", menuItems.filter((item) => item.isAvailable).length],
      ["Active promotions", promotions.filter((promotion) => promotion.currentlyActive).length]
    ].map(([label, value]) => `<article class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></article>`).join("");

    document.getElementById("pendingOrders").innerHTML = selectedStall
      ? `<div class="notice notice-success"><strong>${HC.escapeHtml(selectedStall.name)}</strong><p>Unit ${HC.escapeHtml(selectedStall.unitNumber)} at ${HC.escapeHtml(selectedStall.centreName)} is connected to the backend.</p></div>`
      : '<div class="empty-state"><h3>No stall yet</h3><p>Create your first stall to begin managing menus and promotions.</p></div>';

    const popular = [...menuItems]
      .sort((left, right) => Number(right.likeCount) - Number(left.likeCount))
      .slice(0, 4);
    document.getElementById("popularItems").innerHTML = popular.length
      ? popular.map((item, index) => `<div class="row-between"><span>${index + 1}. ${HC.escapeHtml(item.name)}</span><strong>${Number(item.likeCount) || 0} likes</strong></div>`).join("")
      : '<p class="muted">Menu data will appear after items are created.</p>';
  } catch (error) {
    console.error("Vendor dashboard retrieval failed:", error);
    document.getElementById("pendingOrders").innerHTML = `<p class="notice notice-danger">${HC.escapeHtml(error.message || "Unable to load the dashboard.")}</p>`;
  }

  const actions = [
    ["Manage stalls", "stall-management.html", "Create or update your owned stalls."],
    ["Manage menu", "menu-management.html", "Create and update database menu items."],
    ["Run promotions", "promotion.html", "Create and deactivate stall offers."],
    ["Manage orders", "order.html", "Review customer orders for your stall."]
  ];
  document.getElementById("vendorActions").innerHTML = actions.map(([title, href, text]) =>
    `<a class="card quick-card" href="${href}"><h3>${title}</h3><p>${text}</p></a>`
  ).join("");
});
