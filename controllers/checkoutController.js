const checkoutModel = require("../models/checkoutModel");
console.log("[CHECKOUT CONTROLLER V4 LOADED]", __filename);
function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseCheckoutBody(body) {
  if (typeof body !== "string") return body || {};

  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw createHttpError(400, "Request body contains invalid JSON.");
  }
}

function normalisePaymentMethod(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const methods = {
    cash: "Cash",
    nets: "NETS",
    paynow: "PayNow"
  };

  return methods[key] || null;
}

function validateCheckoutBody(rawBody) {
  const body = parseCheckoutBody(rawBody);

  // Support both the current field name and the older frontend field name.
  const pmtType = normalisePaymentMethod(
    body.pmtType ?? body.paymentMethod ?? body.payment_type
  );

  if (!pmtType) {
    throw createHttpError(400, "Select a valid payment method.");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw createHttpError(400, "The order must contain at least one item.");
  }

  const items = body.items.map((item, index) => {
    const stallId = Number(item?.stallId ?? item?.stall_id);
    const menuItemId = Number(item?.menuItemId ?? item?.menu_item_id);
    const quantity = Number(item?.quantity ?? item?.Quantity);

    if (!Number.isInteger(stallId) || stallId <= 0) {
      throw createHttpError(400, `Item ${index + 1} has an invalid stallId.`);
    }
    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      throw createHttpError(400, `Item ${index + 1} has an invalid menuItemId.`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw createHttpError(400, `Item ${index + 1} quantity must be from 1 to 20.`);
    }

    return { stallId, menuItemId, quantity };
  });

  let pickupTime = null;
  if (body.pickupTime) {
    pickupTime = new Date(body.pickupTime);
    if (Number.isNaN(pickupTime.getTime())) {
      throw createHttpError(400, "Select a valid pickup time.");
    }
    if (pickupTime.getTime() <= Date.now()) {
      throw createHttpError(400, "Pickup time must be in the future.");
    }
  }

  return { pmtType, pickupTime, items };
}

async function createOrder(req, res) {
  try {
    const userId = Number(req.user?.userId ?? req.user?.id ?? req.user?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createHttpError(401, "Authenticated user information is missing.");
    }

    const checkoutData = validateCheckoutBody(req.body);
    console.log("[CHECKOUT BODY]", JSON.stringify(req.body));
    console.log(
      "[CHECKOUT PAYMENT]",
      JSON.stringify(req.body?.pmtType),
      typeof req.body?.pmtType
    );
    const customerId = await checkoutModel.getCustomerId(userId);
    const orderID = await checkoutModel.createOrder({
      customerId,
      ...checkoutData
    });

    return res.status(201).json({
      message: "Order created successfully",
      OrderID: orderID
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: statusCode === 500 ? "Failed to create order" : error.message
    });
  }
}

async function getOrder(req, res) {
  try {
    const userId = Number(req.user?.userId ?? req.user?.id ?? req.user?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createHttpError(401, "Authenticated user information is missing.");
    }

    const customerId = await checkoutModel.getCustomerId(userId);
    const result = await checkoutModel.getOrder(req.params.id, customerId);
    return res.json(result);
  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: statusCode === 500 ? "Failed to retrieve order" : error.message
    });
  }
}

module.exports = {
  createOrder,
  getOrder,
  validateCheckoutBody
};
