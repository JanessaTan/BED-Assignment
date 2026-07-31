document.addEventListener("DOMContentLoaded", () => {
  renderHeader("menu");
  const app = window.HawkerHub;
  const filters = document.getElementById("menuFilters");
  const list = document.getElementById("menuList");
  const status = document.getElementById("menuStatus");
  let page = 1;
  let pages = 1;

  function money(value) {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD"
    }).format(value);
  }

  function createCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    const top = document.createElement("div");
    top.className = "item-card__top";
    const category = document.createElement("span");
    category.className = "chip muted";
    category.textContent = item.category;
    const stall = document.createElement("span");
    stall.className = "chip";
    stall.textContent = item.stallName;
    top.append(category, stall);

    const title = document.createElement("h2");
    title.textContent = item.itemName;
    const description = document.createElement("p");
    description.textContent = item.description || "No description provided.";

    const cuisines = document.createElement("div");
    cuisines.className = "chip-row";
    item.cuisines.forEach((cuisine) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = cuisine.name;
      cuisines.appendChild(chip);
    });

    const footer = document.createElement("div");
    footer.className = "item-card__footer";
    const price = document.createElement("div");
    if (item.hasDiscount) {
      const old = document.createElement("span");
      old.className = "price-old";
      old.textContent = money(item.originalPrice);
      price.appendChild(old);
    }
    const current = document.createElement("span");
    current.className = "price";
    current.textContent = money(item.discountedPrice);
    price.appendChild(current);

    const link = document.createElement("a");
    link.className = "scope-btn secondary";
    link.href = `menu-item.html?id=${encodeURIComponent(item.itemId)}`;
    link.textContent = "Details";
    footer.append(price, link);
    card.append(top, title, description, cuisines, footer);
    return card;
  }

  async function loadCuisines() {
    try {
      const response = await app.apiRequest("/api/cuisines");
      response.data.forEach((cuisine) => {
        const option = document.createElement("option");
        option.value = cuisine.cuisineId;
        option.textContent = cuisine.name;
        filters.cuisineId.appendChild(option);
      });
    } catch {
      // Menu retrieval still works if the optional filter cannot load.
    }
  }

  async function loadMenu() {
    const params = new URLSearchParams({ page, limit: 12 });
    if (filters.search.value.trim()) params.set("search", filters.search.value.trim());
    if (filters.category.value) params.set("category", filters.category.value);
    if (filters.cuisineId.value) params.set("cuisineId", filters.cuisineId.value);
    const [sortBy, sortDir] = filters.sort.value.split(":");
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);

    app.showStatus(status, "Loading menu items...");
    list.replaceChildren();
    try {
      const response = await app.apiRequest(`/api/menu-items?${params}`);
      pages = Math.max(1, response.pagination.pages);
      document.getElementById("pageLabel").textContent = `Page ${page} of ${pages}`;
      document.getElementById("previousPage").disabled = page <= 1;
      document.getElementById("nextPage").disabled = page >= pages;

      if (!response.data.length) {
        app.showStatus(status, "No menu items match your search.");
        return;
      }
      status.hidden = true;
      response.data.forEach((item) => list.appendChild(createCard(item)));
    } catch (error) {
      app.showStatus(status, error.message, "error");
    }
  }

  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1;
    loadMenu();
  });
  document.getElementById("previousPage").addEventListener("click", () => {
    if (page > 1) {
      page -= 1;
      loadMenu();
    }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    if (page < pages) {
      page += 1;
      loadMenu();
    }
  });

  loadCuisines();
  loadMenu();
});
