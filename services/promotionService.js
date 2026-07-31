const promotionModel = require("../models/promotionModel");
const AppError = require("../utils/AppError");

function calculateDiscountedPrice(originalPrice, promotion) {
  const price = Number(originalPrice);
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError(400, "A valid original price is required");
  }

  let discountedPrice = price;
  if (promotion.discountType === "PERCENT") {
    discountedPrice = price * (1 - promotion.discountValue / 100);
  } else if (promotion.discountType === "FIXED") {
    discountedPrice = price - promotion.discountValue;
  }

  return Math.max(0, Math.round((discountedPrice + Number.EPSILON) * 100) / 100);
}

function enrichPromotion(promotion) {
  if (
    promotion.originalPrice === null ||
    promotion.discountType === "ITEM_OFFER"
  ) {
    return { ...promotion, calculatedPrice: null };
  }
  return {
    ...promotion,
    calculatedPrice: calculateDiscountedPrice(
      promotion.originalPrice,
      promotion
    )
  };
}

async function attachBestDiscounts(items) {
  if (!items.length) return [];
  const stallIds = [...new Set(items.map((item) => item.stallId))];
  const promotions = await promotionModel.activeForStalls(stallIds);

  return items.map((item) => {
    const candidates = promotions
      .filter(
        (promotion) =>
          promotion.stallId === item.stallId &&
          (!promotion.itemCode || promotion.itemCode === item.itemCode) &&
          promotion.discountType !== "ITEM_OFFER"
      )
      .map((promotion) => ({
        promotion,
        price: calculateDiscountedPrice(item.price, promotion)
      }))
      .sort(
        (a, b) =>
          a.price - b.price ||
          new Date(a.promotion.endDate) - new Date(b.promotion.endDate)
      );

    const best = candidates[0];
    return {
      ...item,
      originalPrice: item.price,
      discountedPrice: best ? best.price : item.price,
      hasDiscount: Boolean(best && best.price < item.price),
      appliedPromotion: best
        ? {
            promotionId: best.promotion.promotionId,
            promotionName: best.promotion.promotionName,
            discountType: best.promotion.discountType,
            discountValue: best.promotion.discountValue,
            endDate: best.promotion.endDate
          }
        : null
    };
  });
}

module.exports = {
  calculateDiscountedPrice,
  enrichPromotion,
  attachBestDiscounts
};
