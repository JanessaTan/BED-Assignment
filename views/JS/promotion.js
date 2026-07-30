(function () {
  "use strict";

  const PROMOTIONS_API = "/api/promotions";

  const promotionList = document.getElementById("promotionList");
  const promotionStatus = document.getElementById("promotionStatus");

  function textValue(value, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function normalisePromotion(promotion = {}) {
    return {
      id: textValue(promotion.PromoID),
      description: textValue(promotion.PromoDesc, "More information coming soon."),
      stallId: textValue(promotion.StallID),
      stallName: textValue(promotion.StallName),
      startDate: promotion.PromoStartDate,
      endDate: promotion.PromoEndDate
    };
  }

  function parseDate(value) {
    if (!value) {
      return null;
    }

    const source = String(value).trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(source);
    const parsed = new Date(dateOnly ? `${source}T00:00:00` : source);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDate(value) {
    const date = parseDate(value);

    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function addDetail(container, labelText, value, valueClass = "") {
    if (!value) {
      return;
    }

    const row = document.createElement("div");
    row.className = "promotion-detail";

    const label = document.createElement("span");
    label.className = "promotion-detail__label";
    label.textContent = labelText;

    const detail = document.createElement("span");
    detail.className = valueClass
      ? `promotion-detail__value ${valueClass}`
      : "promotion-detail__value";
    detail.textContent = value;

    row.append(label, detail);
    container.appendChild(row);
  }

  function createPromotionCard(rawPromotion = {}) {
    const promotion = normalisePromotion(rawPromotion);

    const card = document.createElement("article");
    card.className = "card card--accent card--interactive promotion-card";

    const top = document.createElement("div");
    top.className = "promotion-top";

    const icon = document.createElement("div");
    icon.className = "promotion-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "DEAL";

    const heading = document.createElement("div");
    heading.className = "promotion-heading";

    const label = document.createElement("span");
    label.className = "promotion-label";
    label.textContent = "SPECIAL PROMOTION";

    heading.appendChild(label);
    top.append(icon, heading);

    const description = document.createElement("p");
    description.className = "soft-panel promotion-desc";
    description.textContent = promotion.description;

    const details = document.createElement("div");
    details.className = "promotion-details";

    addDetail(details, "Stall", promotion.stallName);
    addDetail(details, "Starts", formatDate(promotion.startDate));
    addDetail(details, "Valid until", formatDate(promotion.endDate));

    const actions = document.createElement("div");
    actions.className = "actions stack-mobile promotion-actions";

    if (promotion.stallId) {
      const menuLink = document.createElement("a");
      const stallId = encodeURIComponent(promotion.stallId);

      menuLink.className = "btn";
      menuLink.href = `Menu.html?stall=${stallId}`;
      menuLink.textContent = "View Stall Menu";
      menuLink.setAttribute(
        "aria-label",
        promotion.stallName
          ? `View menu for ${promotion.stallName}`
          : "View the stall menu for this promotion"
      );

      actions.appendChild(menuLink);
    }

    card.append(top, description);

    if (details.children.length > 0) {
      card.appendChild(details);
    }

    if (actions.children.length > 0) {
      card.appendChild(actions);
    }

    return card;
  }

  function showStatus(message, type = "") {
    promotionStatus.hidden = false;
    promotionStatus.className = type ? `status ${type}` : "status";
    promotionStatus.textContent = message;
  }

  function hideStatus() {
    promotionStatus.hidden = true;
  }

  function showLoadError() {
    promotionStatus.hidden = false;
    promotionStatus.className = "status error";
    promotionStatus.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = "Unable to load the promotions.";

    const message = document.createElement("p");
    message.className = "mb-0";
    message.textContent = "Please check your connection and try again.";

    const retryButton = document.createElement("button");
    retryButton.className = "btn promotion-retry";
    retryButton.type = "button";
    retryButton.textContent = "Try Again";
    retryButton.addEventListener("click", loadPromotions);

    promotionStatus.append(heading, message, retryButton);
  }

  async function loadPromotions() {
    showStatus("Loading promotions...");
    promotionList.replaceChildren();

    try {
      const response = await fetch(PROMOTIONS_API, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const promotions = await response.json();

      if (!Array.isArray(promotions)) {
        throw new Error("The server returned an invalid promotions response.");
      }

      if (promotions.length === 0) {
        showStatus(
          "No promotions are available at the moment. Please check again later."
        );
        return;
      }

      const cards = document.createDocumentFragment();

      promotions.forEach(function (promotion) {
        cards.appendChild(createPromotionCard(promotion));
      });

      promotionList.appendChild(cards);
      hideStatus();
    } catch (error) {
      console.error("Unable to load promotions:", error);
      showLoadError();
    }
  }

  loadPromotions();
})();