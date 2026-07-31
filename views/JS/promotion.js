document.addEventListener("DOMContentLoaded", async () => {
  renderHeader("promotions");
  const app = window.HawkerHub;
  const list = document.getElementById("promotionList");
  const status = document.getElementById("promotionStatus");
  const money = (value) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(value);
  const date = (value) =>
    new Intl.DateTimeFormat("en-SG", { dateStyle: "medium" }).format(new Date(value));

  function offerText(promotion) {
    if (promotion.discountType === "PERCENT") return `${promotion.discountValue}% off`;
    if (promotion.discountType === "FIXED") return `${money(promotion.discountValue)} off`;
    return promotion.description || "Special item offer";
  }

  function card(promotion) {
    const article = document.createElement("article");
    article.className = "item-card";
    const top = document.createElement("div");
    top.className = "item-card__top";
    const offer = document.createElement("span");
    offer.className = "chip";
    offer.textContent = offerText(promotion);
    const stall = document.createElement("span");
    stall.className = "chip muted";
    stall.textContent = promotion.stallName;
    top.append(offer, stall);

    const title = document.createElement("h2");
    title.textContent = promotion.promotionName;
    const description = document.createElement("p");
    description.textContent = promotion.description || "Limited-time promotion.";
    const period = document.createElement("p");
    period.textContent = `${date(promotion.startDate)} – ${date(promotion.endDate)}`;
    article.append(top, title, description, period);

    if (promotion.itemName) {
      const item = document.createElement("p");
      item.textContent =
        promotion.calculatedPrice === null
          ? `Applies to ${promotion.itemName}`
          : `${promotion.itemName}: ${money(promotion.originalPrice)} → ${money(promotion.calculatedPrice)}`;
      article.appendChild(item);
      const link = document.createElement("a");
      link.className = "scope-btn secondary";
      link.href = `menu-item.html?id=${encodeURIComponent(promotion.itemId)}`;
      link.textContent = "View item";
      article.appendChild(link);
    }
    return article;
  }

  try {
    const response = await app.apiRequest("/api/promotions/active?limit=100");
    if (!response.data.length) {
      app.showStatus(status, "No promotions are active right now.");
      return;
    }
    status.hidden = true;
    response.data.forEach((promotion) => list.appendChild(card(promotion)));
  } catch (error) {
    app.showStatus(status, error.message, "error");
  }
});
