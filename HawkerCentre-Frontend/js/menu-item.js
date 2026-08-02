document.addEventListener("DOMContentLoaded", function initialiseMenu() {
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const stallId = HC.resolveSelectedStall();
  const stall = HC.getStallById(stallId);
  if (!stall) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }
  const currentUser = HC.getCurrentUser();

  const customerID =
    currentUser?.customerID ||
    currentUser?.customerId ||
    (currentUser?.id === "user-customer-demo" ? "CU000" : null);

  let likedItemKeys = new Set();
  let likeCountByItemKey = {};

  const FRONTEND_ITEM_TO_DB_ITEM = {
    "menu-chicken-rice": { StallID: "S001", ItemCode: "I001" },
    "menu-roast-chicken": { StallID: "S001", ItemCode: "I011" },
    "menu-chicken-soup": { StallID: "S001", ItemCode: "I012" },

    "menu-kaya-set": { StallID: "S010", ItemCode: "I029" },
    "menu-iced-milo": { StallID: "S010", ItemCode: "I030" },

    "menu-laksa": { StallID: "S019", ItemCode: "I087" },
    "menu-veg-rice": { StallID: "S018", ItemCode: "I053" },
    "menu-nasi-lemak": { StallID: "S002", ItemCode: "I013" },
    "menu-prata": { StallID: "S004", ItemCode: "I004" },
    "menu-fish-soup": { StallID: "S005", ItemCode: "I005" },
    "menu-chendol": { StallID: "S009", ItemCode: "I028" }
  };

  function getDbLikeItem(item) {
    return FRONTEND_ITEM_TO_DB_ITEM[item.id] || null;
  }

  function getItemKey(dbItem) {
    return `${dbItem.StallID}|${dbItem.ItemCode}`;
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
    const dbItem = getDbLikeItem(item);

    if (!dbItem) {
      return item.likes || 0;
    }

    return likeCountByItemKey[getItemKey(dbItem)] || 0;
  }

  function isLiked(item) {
    const dbItem = getDbLikeItem(item);

    if (!dbItem) {
      return false;
    }

    return likedItemKeys.has(getItemKey(dbItem));
  }

  async function loadLikeState() {
    likedItemKeys = new Set();
    likeCountByItemKey = {};

    const dbItems = allItems
      .map((item) => getDbLikeItem(item))
      .filter(Boolean);

    const dbStallIds = [...new Set(dbItems.map((dbItem) => dbItem.StallID))];

    for (const dbStallId of dbStallIds) {
      const response = await fetch(`/api/likes/stall/${encodeURIComponent(dbStallId)}/counts`);
      const result = await response.json();

      if (response.ok) {
        result.forEach((entry) => {
          likeCountByItemKey[getItemKey(entry)] = Number(entry.LikeCount) || 0;
        });
      }
    }

    if (!customerID) {
      return;
    }

    const customerResponse = await fetch(`/api/likes/customer/${encodeURIComponent(customerID)}`);
    const customerLikes = await customerResponse.json();

    if (customerResponse.ok) {
      customerLikes.forEach((like) => {
        likedItemKeys.add(getItemKey(like));
      });
    }
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
        const liked = isLiked(item);
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
              <button class="btn btn-muted like-button ${liked ? "liked" : ""}" type="button" data-like="${item.id}" aria-pressed="${liked}">${liked ? "♥" : "♡"} ${getLikes(item)}</button>
            </div>
            <button class="btn btn-primary" type="button" data-add-cart="${item.id}" ${item.available ? "" : "disabled"}>Add to cart</button>
          </div>
        </article>`;
    }).join("");
  }

  document.getElementById("menuResults").addEventListener("click", async function handleMenuAction(event) {
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
      if (!customerID) {
        HC.showToast("Please log in as a customer to like menu items.", "error");
        return;
      }

      const dbItem = getDbLikeItem(item);

      if (!dbItem) {
        HC.showToast("This item is not linked to a database menu item.", "error");
        return;
      }

      try {
        const itemKey = getItemKey(dbItem);
        const liked = likedItemKeys.has(itemKey);

        const result = liked
          ? await unlikeMenuItem(customerID, dbItem.StallID, dbItem.ItemCode)
          : await likeMenuItem(customerID, dbItem.StallID, dbItem.ItemCode);

        if (result.liked) {
          likedItemKeys.add(itemKey);
        } else {
          likedItemKeys.delete(itemKey);
        }

        likeCountByItemKey[itemKey] = Number(result.LikeCount) || 0;

        render();
      } catch (error) {
        console.error("Error updating like:", error);
        HC.showToast(error.message || "Unable to update like.", "error");
      }
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
  loadLikeState().then(render);
});

async function likeMenuItem(customerID, stallID, itemCode) {
  const response = await fetch("/api/likes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      CustomerID: customerID,
      StallID: stallID,
      ItemCode: itemCode
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to like item.");
  }

  return result;
}

async function unlikeMenuItem(customerID, stallID, itemCode) {
  const response = await fetch(
    `/api/likes/${encodeURIComponent(customerID)}/${encodeURIComponent(stallID)}/${encodeURIComponent(itemCode)}`,
    {
      method: "DELETE"
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to remove like.");
  }

  return result;
}