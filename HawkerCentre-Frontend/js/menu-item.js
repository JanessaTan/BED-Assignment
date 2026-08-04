document.addEventListener("DOMContentLoaded", function initialiseMenu() {
  "use strict";
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const stallId = HC.resolveSelectedStall();
  const resultsTarget = document.getElementById("menuResults");
  const emptyTarget = document.getElementById("menuEmpty");
  const countTarget = document.getElementById("menuResultCount");
  const searchInput = document.getElementById("menuSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const priceSort = document.getElementById("priceSort");
  let stall = null;
  let allItems = [];

  if (!stallId) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  function getLikes(item) {
    const userLikes = HC.loadData(HC.KEYS.likes, {});
    return item.likes + (userLikes[String(item.id)] ? 1 : 0);
  }

  function render() {
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const category = categoryFilter?.value || "";
    const sort = priceSort?.value || "";
    const items = allItems.filter((item) => {
      const matches = `${item.name} ${item.description} ${item.cuisines.join(" ")}`.toLowerCase().includes(query);
      return matches && (!category || item.category === category);
    });

    if (sort === "low") items.sort((a, b) => a.price - b.price);
    if (sort === "high") items.sort((a, b) => b.price - a.price);

    countTarget.textContent = `${items.length} menu item${items.length === 1 ? "" : "s"} found`;
    emptyTarget.hidden = items.length > 0;
    resultsTarget.innerHTML = items.map((item) => {
      const userLikes = HC.loadData(HC.KEYS.likes, {});
      const addOns = item.addOns.length
        ? `<fieldset class="menu-addons"><legend>Optional add-ons</legend>${item.addOns.map((addOn, index) => `<label><input type="checkbox" data-addon-index="${index}"> ${HC.escapeHtml(addOn.name)} (+${HC.formatCurrency(addOn.price)})</label>`).join("<br>")}</fieldset>`
        : '<p class="muted">No optional add-ons.</p>';
      return `
        <article class="card menu-card" data-menu-card="${HC.escapeHtml(item.id)}">
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(item.category)}</span><span class="badge ${item.available ? "badge-success" : "badge-danger"}">${item.available ? "Available" : "Unavailable"}</span></div>
          <h2>${HC.escapeHtml(item.name)}</h2>
          <p>${HC.escapeHtml(item.description || "No description is currently available.")}</p>
          <div class="card-meta"><span>${HC.escapeHtml(item.cuisines.join(" · ") || "Cuisine unspecified")}</span>${item.prep === null ? "" : `<span>About ${item.prep} min</span>`}</div>
          <span class="price">${HC.formatCurrency(item.price)}</span>
          <div class="menu-controls">
            ${addOns}
            <div class="row-between">
              <div class="quantity-control" aria-label="Quantity"><button type="button" data-qty-action="decrease" aria-label="Decrease quantity">−</button><output data-quantity>1</output><button type="button" data-qty-action="increase" aria-label="Increase quantity">+</button></div>
              <button class="btn btn-muted like-button ${userLikes[String(item.id)] ? "liked" : ""}" type="button" data-like="${HC.escapeHtml(item.id)}" aria-pressed="${Boolean(userLikes[String(item.id)])}">♥ ${getLikes(item)}</button>
            </div>
            <button class="btn btn-primary" type="button" data-add-cart="${HC.escapeHtml(item.id)}" ${item.available ? "" : "disabled"}>Add to cart</button>
          </div>
        </article>`;
    }).join("");
  }

  async function loadPage() {
    countTarget.textContent = "Loading menu items from the database…";
    resultsTarget.innerHTML = "";
    try {
      stall = await HC.fetchStallById(stallId);
      if (!stall) throw new Error("The selected stall was not found.");
      HC.saveData(HC.KEYS.selectedStall, stall.id);
      const centre = stall.centreId ? await HC.fetchCentreById(stall.centreId).catch(() => null) : null;

      const backLink = document.getElementById("backToStalls");
      if (backLink && stall.centreId !== null && stall.centreId !== undefined) backLink.href = `stalls.html?centre=${encodeURIComponent(stall.centreId)}`;
      document.getElementById("stallName").textContent = stall.name;
      document.getElementById("stallDescription").textContent = stall.description || "No stall description is currently available.";
      const metadata = [stall.cuisine, stall.hours, stall.rating === null ? "" : `★ ${stall.rating.toFixed(1)}`].filter(Boolean);
      document.getElementById("stallMeta").innerHTML = metadata.map((entry) => `<span>${HC.escapeHtml(entry)}</span>`).join("");
      document.getElementById("stallBadges").innerHTML = `<span class="badge ${HC.hygieneBadgeClass(stall.hygieneGrade)}">${HC.escapeHtml(HC.hygieneText(stall.hygieneGrade))}</span>${centre ? `<span class="badge badge-info">${HC.escapeHtml(centre.name)}</span>` : ""}`;

      allItems = await HC.fetchMenuItems({ stallId: stall.id, limit: 100 });
      const categories = [...new Set(allItems.map((item) => item.category).filter(Boolean))].sort();
      categoryFilter?.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${HC.escapeHtml(category)}">${HC.escapeHtml(category)}</option>`).join(""));
      render();
    } catch (error) {
      console.error("Could not load the menu.", error);
      allItems = [];
      countTarget.textContent = "Unable to load menu items";
      emptyTarget.hidden = false;
      resultsTarget.innerHTML = "";
      HC.showToast(error.message || "Could not load menu items from the server.", "error");
    }
  }

  resultsTarget?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-menu-card]");
    if (!card) return;
    const item = allItems.find((candidate) => String(candidate.id) === card.dataset.menuCard);
    if (!item) return;
    const quantityOutput = card.querySelector("[data-quantity]");

    if (event.target.matches("[data-qty-action]")) {
      const current = Number(quantityOutput.value || quantityOutput.textContent) || 1;
      const next = event.target.dataset.qtyAction === "increase" ? Math.min(20, current + 1) : Math.max(1, current - 1);
      quantityOutput.value = next;
      quantityOutput.textContent = String(next);
    }

    if (event.target.matches("[data-like]")) {
      const likes = HC.loadData(HC.KEYS.likes, {});
      likes[String(item.id)] = !likes[String(item.id)];
      HC.saveData(HC.KEYS.likes, likes);
      render();
    }

    if (event.target.matches("[data-add-cart]")) {
      if (!item.available) return;
      const addOns = [...card.querySelectorAll("[data-addon-index]:checked")].map((input) => item.addOns[Number(input.dataset.addonIndex)]).filter(Boolean);
      HC.addToCart({ ...item, stallName: stall.name }, Number(quantityOutput.value || quantityOutput.textContent), addOns);
      HC.showToast(`${item.name} added to cart.`);
    }
  });

  [searchInput, categoryFilter, priceSort].forEach((element) => element?.addEventListener(element === searchInput ? "input" : "change", render));
  loadPage();
});
