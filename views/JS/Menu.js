(function () {
  "use strict";

  const menuList = document.getElementById("menuList");
  const menuStatus = document.getElementById("menuStatus");
  const stallId = new URLSearchParams(window.location.search).get("stall");

  const CUISINE_IMAGES = {
    Chinese: "../img/chinese.jpg",
    Malay: "../img/malay.jpg",
    Indian: "../img/indian.jpg",
    Japanese: "../img/thai.jpg",
    Western: "../img/western.jpg"
  };
  const DEFAULT_IMAGE = "../img/chinese.jpg";
  const DRINK_IMAGE = "../img/drink.jpg";

  function textValue(value, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function pickImage(category, cuisines) {
    if (category === "Drink") {
      return DRINK_IMAGE;
    }
    const firstCuisine = textValue(cuisines).split(",")[0].trim();
    return CUISINE_IMAGES[firstCuisine] || DEFAULT_IMAGE;
  }

  function normaliseMenuItem(item = {}) {
    const category = textValue(item.ItemCategory);
    const cuisines = textValue(item.Cuisines);

    return {
      itemCode: textValue(item.ItemCode),
      title: textValue(item.ItemDesc, "Menu item"),
      category,
      cuisines,
      price: Number(item.ItemPrice) || 0,
      image: pickImage(category, cuisines)
    };
  }

  function showStatus(message, type = "") {
    menuStatus.hidden = false;
    menuStatus.className = type ? `status ${type}` : "status";
    menuStatus.textContent = message;
  }

  function hideStatus() {
    menuStatus.hidden = true;
  }

  function addToCart(item) {
    let store = JSON.parse(localStorage.getItem("store")) || { cart: [], order: null };
    const existing = store.cart.find((i) => i.itemCode === item.itemCode);

    if (existing) {
      existing.qty += 1;
    } else {
      store.cart.push({ ...item, stallId, qty: 1 });
    }

    localStorage.setItem("store", JSON.stringify(store));
    window.location.href = "Checkout.html";
  }

  function createMenuCard(rawItem) {
    const item = normaliseMenuItem(rawItem);

    const card = document.createElement("div");
    card.className = "menu-card";

    card.innerHTML = `
      <img src="${item.image}" class="menu-img" alt="${item.title}" loading="lazy">
      <div class="menu-content">
        <h2 class="menu-item-title">${item.title}</h2>
        <p class="menu-description">${[item.category, item.cuisines].filter(Boolean).join(" · ")}</p>
        <div class="menu-action">
          <p class="menu-price">$${item.price.toFixed(2)}</p>
          <button class="menu-btn" type="button" aria-label="Add ${item.title} to cart">Add to cart</button>
        </div>
      </div>
    `;

    card.querySelector(".menu-btn").addEventListener("click", () => addToCart(item));
    return card;
  }

  async function loadMenu() {
    if (!stallId) {
      showStatus("Select a stall first to see its menu.");
      const link = document.createElement("a");
      link.href = "Stalls.html";
      link.className = "btn mt-16";
      link.textContent = "Browse stalls";
      menuStatus.appendChild(document.createElement("br"));
      menuStatus.appendChild(link);
      return;
    }

    showStatus("Loading menu...");
    menuList.innerHTML = "";

    try {
      const res = await fetch(`/api/stalls/${encodeURIComponent(stallId)}/menu`, {
        headers: { Accept: "application/json" }
      });
      const items = await res.json();

      if (!res.ok) {
        showStatus(items.message || "Unable to load this menu.", "error");
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        showStatus("This stall hasn't added any menu items yet.");
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((item) => fragment.appendChild(createMenuCard(item)));
      menuList.appendChild(fragment);
      hideStatus();
    } catch (err) {
      console.error("Unable to load menu:", err);
      showStatus("Unable to reach the server. Please try again later.", "error");
    }
  }

  loadMenu();
})();