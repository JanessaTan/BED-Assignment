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
  let likedItemKeys = new Set();
  let likeCountByItemKey = {};

  if (!stallId) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  function getCustomerID() {
    const currentUser = HC.getCurrentUser();

    if (!currentUser || currentUser.name === "Guest") {
      return null;
    }

    const existingCustomerID =
      currentUser.customerID ||
      currentUser.CustomerID ||
      currentUser.customerId;

    if (existingCustomerID) {
      return String(existingCustomerID);
    }

    const rawUserID =
      currentUser.userId ||
      currentUser.id ||
      currentUser.UserID ||
      currentUser.user_id;

    const numericUserID = Number(rawUserID);

    if (Number.isInteger(numericUserID) && numericUserID > 0 && numericUserID <= 9999) {
      return `C${String(numericUserID).padStart(4, "0")}`;
    }

    return null;
  }

  function getDbLikeItem(item) {
    const stallID =
      item.likeStallID ||
      item.LikeStallID ||
      item.StallID ||
      item.stallID ||
      item.stallId;

    const itemCode =
      item.likeItemCode ||
      item.LikeItemCode ||
      item.ItemCode ||
      item.itemCode ||
      item.menuItemId ||
      item.id;

    if (!stallID || !itemCode) {
      return null;
    }

    return {
      StallID: String(stallID),
      ItemCode: String(itemCode)
    };
  }

  function getItemKey(dbItem) {
    return `${dbItem.StallID}|${dbItem.ItemCode}`;
  }

  function getLikes(item) {
    const dbItem = getDbLikeItem(item);

    if (!dbItem) {
      return Number(item.likes) || 0;
    }

    const itemKey = getItemKey(dbItem);

    return Number(likeCountByItemKey[itemKey] ?? item.likes ?? 0);
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

    const stallIDs = [...new Set(dbItems.map((dbItem) => dbItem.StallID))];

    for (const stallID of stallIDs) {
      const response = await fetch(`/api/likes/stall/${encodeURIComponent(stallID)}/counts`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to load like counts.");
      }

      result.forEach((entry) => {
        const itemKey = getItemKey({
          StallID: entry.StallID,
          ItemCode: entry.ItemCode
        });

        likeCountByItemKey[itemKey] = Number(entry.LikeCount) || 0;
      });
    }

    const customerID = getCustomerID();

    if (!customerID) {
      return;
    }

    const customerResponse = await fetch(`/api/likes/customer/${encodeURIComponent(customerID)}`);
    const customerLikes = await customerResponse.json();

    if (!customerResponse.ok) {
      throw new Error(customerLikes.message || customerLikes.error || "Failed to load customer likes.");
    }

    customerLikes.forEach((like) => {
      likedItemKeys.add(getItemKey({
        StallID: like.StallID,
        ItemCode: like.ItemCode
      }));
    });
  }

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
      // const userLikes = HC.loadData(HC.KEYS.likes, {});
      const liked = isLiked(item);
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
              <button class="btn btn-muted like-button ${liked ? "liked" : ""}" type="button"
                data-like="${HC.escapeHtml(item.id)}"
                aria-pressed="${liked}"
                aria-label="${liked ? `Unlike ${HC.escapeHtml(item.name)}` : `Like ${HC.escapeHtml(item.name)}`}">
                ${liked ? "♥" : "♡"} ${getLikes(item)}
              </button>
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
      await loadLikeState();
      const categories = [...new Set(allItems.map((item) => item.category).filter(Boolean))].sort();
      categoryFilter.innerHTML = `<option value="">All categories</option>`;
      categoryFilter?.insertAdjacentHTML(
        "beforeend",
        categories
          .map((category) => `<option value="${HC.escapeHtml(category)}">${HC.escapeHtml(category)}</option>`)
          .join("")
      );
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

  resultsTarget?.addEventListener("click", async (event) => {
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

    const likeButton = event.target.closest("[data-like]");

    if (likeButton) {
      const customerID = getCustomerID();

      if (!customerID) {
        HC.showToast("Please log in as a customer to like menu items.", "error");
        window.setTimeout(() => {
          window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }, 700);
        return;
      }

      const dbItem = getDbLikeItem(item);

      if (!dbItem) {
        HC.showToast("This menu item is missing its database like mapping.", "error");
        return;
      }

      try {
        likeButton.disabled = true;
        const itemKey = getItemKey(dbItem);
        const currentlyLiked = likedItemKeys.has(itemKey);

        const result = currentlyLiked
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
      } finally {
        likeButton.disabled = false;
      }
      return;
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
