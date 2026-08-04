document.addEventListener("DOMContentLoaded", function initialisePromotions() {
  "use strict";
  const user = HC.getCurrentUser();
  const allowed = user?.role === "vendor" ? ["vendor"] : ["customer", "guest"];
  if (!HC.initPage("promotion", allowed)) return;

  const centreFilter = document.getElementById("promotionCentre");
  const stallFilter = document.getElementById("promotionStall");
  const resultTarget = document.getElementById("promotionResults");
  const countTarget = document.getElementById("promotionCount");
  let centres = [];
  let stalls = [];
  let promotions = [];

  function render() {
    const centreId = centreFilter?.value || "";
    const stallId = stallFilter?.value || "";
    const filtered = promotions.filter((promotion) => (!centreId || String(promotion.centreId) === centreId) && (!stallId || String(promotion.stallId) === stallId));
    countTarget.textContent = `${filtered.length} promotion${filtered.length === 1 ? "" : "s"} found`;
    resultTarget.innerHTML = filtered.map((promotion) => {
      const active = HC.isPromotionActive(promotion);
      const stall = stalls.find((item) => String(item.id) === String(promotion.stallId));
      const centre = centres.find((item) => String(item.id) === String(promotion.centreId));
      const dateText = [promotion.start && HC.formatDate(promotion.start), promotion.end && HC.formatDate(promotion.end)].filter(Boolean).join(" - ");
      return `
        <article class="card promotion-card ${active ? "" : "expired"}">
          <span class="badge ${active ? "badge-success" : "badge-neutral"}">${active ? "Active" : "Expired / inactive"}</span>
          <h2>${HC.escapeHtml(promotion.title)}</h2>
          <p>${HC.escapeHtml(promotion.description || "No description is currently available.")}</p>
          <div class="card-meta">${[stall?.name, centre?.name, dateText].filter(Boolean).map((item) => `<span>${HC.escapeHtml(item)}</span>`).join("")}</div>
          <div class="card-actions">${user?.role !== "vendor" ? `<button class="btn btn-primary" type="button" data-apply-promo="${HC.escapeHtml(promotion.id)}" ${active ? "" : "disabled"}>Apply to eligible cart items</button>` : '<a class="btn btn-outline" href="vendor-dashboard.html">Vendor dashboard</a>'}</div>
        </article>`;
    }).join("");
  }

  async function loadPage() {
    countTarget.textContent = "Loading promotions from the database…";
    resultTarget.innerHTML = "";
    try {
      [centres, stalls, promotions] = await Promise.all([
        HC.fetchCentres({ limit: 100, activeOnly: true }),
        HC.fetchStalls({ limit: 100, activeOnly: true }),
        HC.fetchPromotions({ limit: 100 })
      ]);
      centreFilter?.insertAdjacentHTML("beforeend", centres.map((centre) => `<option value="${HC.escapeHtml(centre.id)}">${HC.escapeHtml(centre.name)}</option>`).join(""));
      stallFilter?.insertAdjacentHTML("beforeend", stalls.map((stall) => `<option value="${HC.escapeHtml(stall.id)}">${HC.escapeHtml(stall.name)}</option>`).join(""));
      render();
    } catch (error) {
      console.error("Could not load promotions.", error);
      promotions = [];
      countTarget.textContent = "Unable to load promotions";
      resultTarget.innerHTML = "";
      HC.showToast(error.message || "Could not load promotions from the server.", "error");
    }
  }

  centreFilter?.addEventListener("change", render);
  stallFilter?.addEventListener("change", render);

  resultTarget?.addEventListener("click", async (event) => {
    const promotionId = event.target.closest("[data-apply-promo]")?.dataset.applyPromo;
    if (!promotionId) return;
    try {
      const promotion = await HC.fetchPromotionById(promotionId);
      if (!promotion || !HC.isPromotionActive(promotion)) throw new Error("This promotion is not active.");
      const eligibleIds = promotion.eligibleItemIds.map(String);
      if (!eligibleIds.length) throw new Error("The server did not return eligible menu items for this promotion.");

      const cart = HC.getCart();
      let applied = 0;
      cart.forEach((line) => {
        if (eligibleIds.includes(String(line.menuItemId))) {
          line.promotionId = promotion.id;
          line.promotionDiscount = HC.promotionDiscountForLine(promotion, line);
          line.promotionTitle = promotion.title;
          applied += 1;
        }
      });
      HC.saveCart(cart);
      HC.showToast(applied ? `Promotion applied to ${applied} cart item${applied === 1 ? "" : "s"}.` : "No eligible item is currently in your cart.", applied ? "" : "error");
    } catch (error) {
      console.error("Could not apply promotion.", error);
      HC.showToast(error.message || "Could not apply this promotion.", "error");
    }
  });

  loadPage();
});
