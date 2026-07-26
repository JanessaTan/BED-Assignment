(function () {
  "use strict";

  const PROMOTIONS_API = "/api/promotions";

  const promotionList = document.getElementById("promotionList");
  const promotionStatus = document.getElementById("promotionStatus");

  function firstValue(object, keys) {
    for (const key of keys) {
      const value = object?.[key];

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }

    return "";
  }

  function textValue(value, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function normalisePromotion(promotion = {}) {
    return {
      id: textValue(
        firstValue(promotion, [
          "PromotionID",
          "PromoID",
          "promotionId",
          "id"
        ])
      ),
      title: textValue(
        firstValue(promotion, [
          "PromotionTitle",
          "PromotionName",
          "PromoTitle",
          "PromoName",
          "Title",
          "name"
        ]),
        "Special HawkerHub Offer"
      ),
      description: textValue(
        firstValue(promotion, [
          "PromotionDesc",
          "PromoDesc",
          "Description",
          "description"
        ]),
        "More information about this promotion is coming soon."
      ),
      stallId: textValue(
        firstValue(promotion, [
          "StallID",
          "stallId",
          "stall_id"
        ])
      ),
      stallName: textValue(
        firstValue(promotion, [
          "StallName",
          "stallName",
          "stall_name"
        ])
      ),
      startDate: firstValue(promotion, [
        "StartDate",
        "ValidFrom",
        "startDate",
        "validFrom"
      ]),
      endDate: firstValue(promotion, [
        "EndDate",
        "ValidUntil",
        "ValidTo",
        "endDate",
        "validUntil"
      ]),
      code: textValue(
        firstValue(promotion, [
          "PromotionCode",
          "PromoCode",
          "Code",
          "code"
        ])
      ),
      discount: firstValue(promotion, [
        "DiscountPercent",
        "Discount",
        "Offer",
        "discount"
      ]),
      isActive: firstValue(promotion, [
        "IsActive",
        "Active",
        "isActive"
      ])
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

  function isFalseValue(value) {
    return value === false || value === 0 ||
      ["false", "0", "inactive"].includes(String(value).toLowerCase());
  }

  function getPromotionState(promotion) {
    if (isFalseValue(promotion.isActive)) {
      return { label: "Ended", className: "orange", ended: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startsOn = parseDate(promotion.startDate);
    const endsOn = parseDate(promotion.endDate);

    if (startsOn && startsOn > today) {
      return { label: "Upcoming", className: "orange", ended: false };
    }

    if (endsOn) {
      endsOn.setHours(23, 59, 59, 999);

      if (endsOn < today) {
        return { label: "Ended", className: "orange", ended: true };
      }
    }

    return { label: "Available Now", className: "", ended: false };
  }

  function formatDiscount(value) {
    const discount = textValue(value);

    if (!discount) {
      return "DEAL";
    }

    if (/^\d+(\.\d+)?$/.test(discount)) {
      return `${discount}%`;
    }

    return discount;
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
    const state = getPromotionState(promotion);

    const card = document.createElement("article");
    card.className = "card card--accent card--interactive promotion-card";

    if (state.ended) {
      card.classList.add("is-ended");
    }

    const top = document.createElement("div");
    top.className = "promotion-top";

    const icon = document.createElement("div");
    icon.className = "promotion-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = formatDiscount(promotion.discount);

    const heading = document.createElement("div");
    heading.className = "promotion-heading";

    const label = document.createElement("span");
    label.className = "promotion-label";
    label.textContent = "SPECIAL PROMOTION";

    const title = document.createElement("h2");
    title.className = "card-title promotion-title";
    title.textContent = promotion.title;

    heading.append(label, title);
    top.append(icon, heading);

    const description = document.createElement("p");
    description.className = "soft-panel promotion-desc";
    description.textContent = promotion.description;

    const details = document.createElement("div");
    details.className = "promotion-details";

    addDetail(
      details,
      "Status",
      state.label,
      state.className ? `badge ${state.className}` : "badge"
    );
    addDetail(details, "Stall", promotion.stallName);
    addDetail(details, "Starts", formatDate(promotion.startDate));
    addDetail(details, "Valid until", formatDate(promotion.endDate));
    addDetail(details, "Promo code", promotion.code, "promotion-code");

    const actions = document.createElement("div");
    actions.className = "actions stack-mobile promotion-actions";

    if (promotion.stallId) {
      const menuLink = document.createElement("a");
      const stallId = encodeURIComponent(promotion.stallId);

      menuLink.className = state.ended ? "btn muted" : "btn";
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

      const responseBody = await response.json();
      const promotions = Array.isArray(responseBody)
        ? responseBody
        : responseBody?.promotions;

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