document.addEventListener("DOMContentLoaded", async () => {
  renderHeader("menu");
  const app = window.HawkerHub;
  const status = document.getElementById("itemStatus");
  const details = document.getElementById("itemDetails");
  const itemId = new URLSearchParams(window.location.search).get("id");
  if (!itemId || !/^\d+$/.test(itemId)) {
    app.showStatus(status, "A valid menu item ID is required.", "error");
    return;
  }

  const money = (value) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(value);

  try {
    const response = await app.apiRequest(`/api/menu-items/${itemId}`);
    const item = response.data;
    document.getElementById("itemStall").textContent = `${item.stallName} · ${item.category}`;
    document.getElementById("itemName").textContent = item.itemName;
    document.getElementById("itemDescription").textContent = item.description || "No description provided.";
    document.getElementById("itemPrice").textContent = money(item.discountedPrice);
    document.getElementById("itemDietary").textContent =
      `${item.isVegetarian ? "Vegetarian. " : ""}${item.dietaryInfo || "No dietary information provided."}`;
    item.cuisines.forEach((cuisine) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = cuisine.name;
      document.getElementById("itemCuisines").appendChild(chip);
    });
    if (item.appliedPromotion) {
      const promotion = document.getElementById("itemPromotion");
      promotion.hidden = false;
      promotion.textContent = `${item.appliedPromotion.promotionName}: ${money(item.originalPrice)} → ${money(item.discountedPrice)}`;
    }
    status.hidden = true;
    details.hidden = false;
  } catch (error) {
    app.showStatus(status, error.message, "error");
  }
});
