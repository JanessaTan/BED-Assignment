document.addEventListener("DOMContentLoaded", function initialisePromotions() {
  const user = HC.getCurrentUser();
  const allowed = user?.role === "vendor" ? ["vendor"] : ["customer", "guest"];
  if (!HC.initPage("promotion", allowed)) return;

  const centreFilter = document.getElementById("promotionCentre");
  const stallFilter = document.getElementById("promotionStall");
  centreFilter.insertAdjacentHTML("beforeend", HC.centres.map((centre) => `<option value="${centre.id}">${HC.escapeHtml(centre.name)}</option>`).join(""));
  stallFilter.insertAdjacentHTML("beforeend", HC.stalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join(""));

  function render() {
    const centreId = centreFilter.value;
    const stallId = stallFilter.value;
    const promotions = HC.loadData(HC.KEYS.promotions, []).filter((promotion) => (!centreId || promotion.centreId === centreId) && (!stallId || promotion.stallId === stallId));
    document.getElementById("promotionCount").textContent = `${promotions.length} promotion${promotions.length === 1 ? "" : "s"} found`;
    document.getElementById("promotionResults").innerHTML = promotions.map((promotion) => {
      const active = HC.isPromotionActive(promotion);
      const stall = HC.getStallById(promotion.stallId);
      const centre = HC.getCentreById(promotion.centreId);
      return `
        <article class="card promotion-card ${active ? "" : "expired"}">
          <span class="badge ${active ? "badge-success" : "badge-neutral"}">${active ? "Active" : "Expired / inactive"}</span>
          <h2>${HC.escapeHtml(promotion.title)}</h2><p>${HC.escapeHtml(promotion.description)}</p>
          <div class="card-meta"><span>${HC.escapeHtml(stall?.name)}</span><span>${HC.escapeHtml(centre?.name)}</span><span>${HC.formatDate(promotion.start)} - ${HC.formatDate(promotion.end)}</span></div>
          <div class="card-actions">${user?.role !== "vendor" ? `<button class="btn btn-primary" type="button" data-apply-promo="${promotion.id}" ${active ? "" : "disabled"}>Apply to eligible cart items</button>` : '<a class="btn btn-outline" href="vendor-dashboard.html">Vendor dashboard</a>'}</div>
        </article>`;
    }).join("");
  }

  centreFilter.addEventListener("change", render);
  stallFilter.addEventListener("change", render);
  document.getElementById("promotionResults").addEventListener("click", function applyPromotion(event) {
    const promotionId = event.target.closest("[data-apply-promo]")?.dataset.applyPromo;
    if (!promotionId) return;
    const promotion = HC.getPromotionById(promotionId);
    const cart = HC.getCart();
    let applied = 0;
    cart.forEach((line) => {
      if (promotion.eligibleItemIds.includes(line.menuItemId)) {
        line.promotionDiscount = promotion.discount;
        line.promotionTitle = promotion.title;
        applied += 1;
      }
    });
    HC.saveCart(cart);
    HC.showToast(applied ? `Promotion applied to ${applied} cart item${applied === 1 ? "" : "s"}.` : "No eligible item is currently in your cart.", applied ? "" : "error");
  });
  render();
});
