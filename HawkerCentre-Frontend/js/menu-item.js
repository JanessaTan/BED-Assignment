document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const stallId = Number(HC.resolveSelectedStall());
  if (!Number.isInteger(stallId) || stallId < 1) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  const results = document.getElementById("menuResults");
  const count = document.getElementById("menuResultCount");
  const empty = document.getElementById("menuEmpty");
  let allItems = [];

  ["menuSearch", "categoryFilter", "priceSort"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "menuSearch" ? "input" : "change", render);
  });
  results.addEventListener("click", handleMenuAction);

  await loadPage();

  async function loadPage() {
    count.textContent = "Loading menu items from the database...";
    try {
      const [stallResponse, itemResponse] = await Promise.all([
        apiGet(`/stalls/${stallId}`),
        apiGet(`/menu-items?stallId=${stallId}&limit=100`)
      ]);
      const stall = stallResponse?.data;
      allItems = (itemResponse?.data || []).map(toCartCompatibleItem);
      if (!stall) throw new Error("The selected stall was not found.");

      document.getElementById("backToStalls").href = `stalls.html?centre=${stall.centreId}`;
      document.getElementById("stallName").textContent = stall.name;
      document.getElementById("stallDescription").textContent = stall.description || "No description provided.";
      document.getElementById("stallMeta").innerHTML = [
        (stall.cuisines || []).join(" · "),
        stall.openingHours,
        `★ ${Number(stall.averageRating || 0).toFixed(1)}`
      ].filter(Boolean).map((value) => `<span>${HC.escapeHtml(value)}</span>`).join("");
      document.getElementById("stallBadges").innerHTML = `
        <span class="badge ${HC.hygieneBadgeClass(stall.hygieneGrade)}">${HC.escapeHtml(stall.hygieneGrade ? HC.hygieneText(stall.hygieneGrade) : "Hygiene grade unavailable")}</span>
        <span class="badge badge-info">${HC.escapeHtml(stall.centreName)}</span>
      `;

      const categories = [...new Set(allItems.map((item) => item.category))].sort();
      document.getElementById("categoryFilter").insertAdjacentHTML(
        "beforeend",
        categories.map((category) => `<option>${HC.escapeHtml(category)}</option>`).join("")
      );
      render();
    } catch (error) {
      console.error("Menu retrieval failed:", error);
      allItems = [];
      render();
      count.textContent = error.message || "Unable to load menu items.";
    }
  }

  function toCartCompatibleItem(item) {
    return {
      ...item,
      id: String(item.menuItemId),
      stallId: String(item.stallId),
      prep: item.preparationMinutes,
      available: Boolean(item.isAvailable),
      likes: Number(item.likeCount) || 0,
      addOns: item.addOns || []
    };
  }

  function render() {
    const query = document.getElementById("menuSearch").value.trim().toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const sort = document.getElementById("priceSort").value;
    const items = allItems.filter((item) => {
      const searchable = `${item.name} ${item.description} ${(item.cuisines || []).join(" ")}`.toLowerCase();
      return searchable.includes(query) && (!category || item.category === category);
    });

    if (sort === "low") items.sort((left, right) => left.price - right.price);
    if (sort === "high") items.sort((left, right) => right.price - left.price);

    count.textContent = `${items.length} menu item${items.length === 1 ? "" : "s"} found`;
    empty.hidden = items.length > 0;
    results.innerHTML = items.map((item) => {
      const addOns = item.addOns.length
        ? `<fieldset class="menu-addons"><legend>Optional add-ons</legend>${item.addOns.map((addOn, index) => `<label><input type="checkbox" data-addon-index="${index}"> ${HC.escapeHtml(addOn.name)} (+${HC.formatCurrency(addOn.price)})</label>`).join("<br>")}</fieldset>`
        : '<p class="muted">No optional add-ons.</p>';
      return `
        <article class="card menu-card" data-menu-card="${item.id}">
          <div class="row-between">
            <span class="badge badge-primary">${HC.escapeHtml(item.category)}</span>
            <span class="badge ${item.available ? "badge-success" : "badge-danger"}">${item.available ? "Available" : "Unavailable"}</span>
          </div>
          <h2>${HC.escapeHtml(item.name)}</h2>
          <p>${HC.escapeHtml(item.description)}</p>
          <div class="card-meta"><span>${(item.cuisines || []).map(HC.escapeHtml).join(" · ")}</span><span>About ${item.prep} min</span><span>♥ ${item.likes}</span></div>
          <span class="price">${HC.formatCurrency(item.price)}</span>
          <div class="menu-controls">
            ${addOns}
            <div class="quantity-control" aria-label="Quantity">
              <button type="button" data-qty-action="decrease" aria-label="Decrease quantity">−</button>
              <output data-quantity>1</output>
              <button type="button" data-qty-action="increase" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn-primary" type="button" data-add-cart ${item.available ? "" : "disabled"}>Add to cart</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function handleMenuAction(event) {
    const card = event.target.closest("[data-menu-card]");
    if (!card) return;
    const item = allItems.find((candidate) => candidate.id === card.dataset.menuCard);
    const quantityOutput = card.querySelector("[data-quantity]");

    if (event.target.matches("[data-qty-action]")) {
      const current = Number(quantityOutput.value || quantityOutput.textContent);
      const next = event.target.dataset.qtyAction === "increase"
        ? Math.min(20, current + 1)
        : Math.max(1, current - 1);
      quantityOutput.value = next;
      quantityOutput.textContent = String(next);
    }

    if (event.target.matches("[data-add-cart]") && item.available) {
      const addOns = [...card.querySelectorAll("[data-addon-index]:checked")]
        .map((input) => item.addOns[Number(input.dataset.addonIndex)]);
      HC.addToCart(item, Number(quantityOutput.value || quantityOutput.textContent), addOns);
      HC.showToast(`${item.name} added to cart.`);
    }
  }
});
