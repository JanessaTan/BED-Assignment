document.addEventListener("DOMContentLoaded", function initialiseMenu() {
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const stallId = HC.resolveSelectedStall();
  const stall = HC.getStallById(stallId);
  if (!stall) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }
  HC.saveData(HC.KEYS.selectedStall, stall.id);

  const centre = HC.getCentreById(stall.centreId);
  document.getElementById("backToStalls").href = `stalls.html?centre=${encodeURIComponent(stall.centreId)}`;
  document.getElementById("stallName").textContent = stall.name;
  document.getElementById("stallDescription").textContent = stall.description;
  document.getElementById("stallMeta").innerHTML = `<span>${HC.escapeHtml(stall.cuisine)}</span><span>${HC.escapeHtml(stall.hours)}</span><span>★ ${stall.rating.toFixed(1)}</span>`;
  const hygieneGrade = HC.getCurrentHygieneRecord(stall.id)?.grade || stall.hygiene;
  document.getElementById("stallBadges").innerHTML = `<span class="badge ${HC.hygieneBadgeClass(hygieneGrade)}">${HC.hygieneText(hygieneGrade)}</span><span class="badge badge-info">${HC.escapeHtml(centre.name)}</span>`;

  const allItems = HC.getMenuItems().filter((item) => item.stallId === stall.id);
  const categories = [...new Set(allItems.map((item) => item.category))].sort();
  document.getElementById("categoryFilter").insertAdjacentHTML("beforeend", categories.map((category) => `<option>${HC.escapeHtml(category)}</option>`).join(""));

  function getLikes(item) {
    const userLikes = HC.loadData(HC.KEYS.likes, {});
    return item.likes + (userLikes[item.id] ? 1 : 0);
  }

  function render() {
    const query = document.getElementById("menuSearch").value.trim().toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const sort = document.getElementById("priceSort").value;
    let items = allItems.filter((item) => {
      const matches = `${item.name} ${item.description} ${item.cuisines.join(" ")}`.toLowerCase().includes(query);
      return matches && (!category || item.category === category);
    });
    if (sort === "low") items.sort((a, b) => a.price - b.price);
    if (sort === "high") items.sort((a, b) => b.price - a.price);

    document.getElementById("menuResultCount").textContent = `${items.length} menu item${items.length === 1 ? "" : "s"} found`;
    document.getElementById("menuEmpty").hidden = items.length > 0;
    document.getElementById("menuResults").innerHTML = items.map((item) => {
      const userLikes = HC.loadData(HC.KEYS.likes, {});
      const addOns = item.addOns.length
        ? `<fieldset class="menu-addons"><legend>Optional add-ons</legend>${item.addOns.map((addOn, index) => `<label><input type="checkbox" data-addon-index="${index}"> ${HC.escapeHtml(addOn.name)} (+${HC.formatCurrency(addOn.price)})</label>`).join("<br>")}</fieldset>`
        : '<p class="muted">No optional add-ons.</p>';
      return `
        <article class="card menu-card" data-menu-card="${item.id}">
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(item.category)}</span><span class="badge ${item.available ? "badge-success" : "badge-danger"}">${item.available ? "Available" : "Unavailable"}</span></div>
          <h2>${HC.escapeHtml(item.name)}</h2>
          <p>${HC.escapeHtml(item.description)}</p>
          <div class="card-meta"><span>${item.cuisines.map(HC.escapeHtml).join(" · ")}</span><span>About ${item.prep} min</span></div>
          <span class="price">${HC.formatCurrency(item.price)}</span>
          <div class="menu-controls">
            ${addOns}
            <div class="row-between">
              <div class="quantity-control" aria-label="Quantity">
                <button type="button" data-qty-action="decrease" aria-label="Decrease quantity">−</button>
                <output data-quantity>1</output>
                <button type="button" data-qty-action="increase" aria-label="Increase quantity">+</button>
              </div>
              <button class="btn btn-muted like-button ${userLikes[item.id] ? "liked" : ""}" type="button" data-like="${item.id}" aria-pressed="${Boolean(userLikes[item.id])}">♥ ${getLikes(item)}</button>
            </div>
            <button class="btn btn-primary" type="button" data-add-cart="${item.id}" ${item.available ? "" : "disabled"}>Add to cart</button>
          </div>
        </article>`;
    }).join("");
  }

  document.getElementById("menuResults").addEventListener("click", function handleMenuAction(event) {
    const card = event.target.closest("[data-menu-card]");
    if (!card) return;
    const item = allItems.find((candidate) => candidate.id === card.dataset.menuCard);

    const quantityOutput = card.querySelector("[data-quantity]");
    if (event.target.matches("[data-qty-action]")) {
      const current = Number(quantityOutput.value || quantityOutput.textContent);
      const next = event.target.dataset.qtyAction === "increase" ? Math.min(20, current + 1) : Math.max(1, current - 1);
      quantityOutput.value = next;
      quantityOutput.textContent = String(next);
    }

    if (event.target.matches("[data-like]")) {
      const likes = HC.loadData(HC.KEYS.likes, {});
      likes[item.id] = !likes[item.id];
      HC.saveData(HC.KEYS.likes, likes);
      render();
    }

    if (event.target.matches("[data-add-cart]")) {
      if (!item.available) return;
      const addOns = [...card.querySelectorAll("[data-addon-index]:checked")].map((input) => item.addOns[Number(input.dataset.addonIndex)]);
      HC.addToCart(item, Number(quantityOutput.value || quantityOutput.textContent), addOns);
      HC.showToast(`${item.name} added to cart.`);
    }
  });

  ["menuSearch", "categoryFilter", "priceSort"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "menuSearch" ? "input" : "change", render);
  });
  render();
});
