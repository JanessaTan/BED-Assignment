document.addEventListener("DOMContentLoaded", async function initialiseOrderTracking() {
  "use strict";

  const currentUser = HC.getCurrentUser();
  const isVendor = currentUser?.role === "vendor";
  if (!HC.initPage(isVendor ? "orders" : "history", isVendor ? ["vendor"] : ["customer", "guest"])) {
    return;
  }

  const statusSteps = [
    "Order received",
    "Preparing",
    "Ready for collection",
    "Completed"
  ];

  const details = document.getElementById("orderDetails");
  const missing = document.getElementById("orderMissing");

  let order = null;

  try {
    showLoading();
    const orderId =
      HC.getQueryParameter("order") ||
      sessionStorage.getItem("hc.latestOrder");

    if (orderId) {
      order = await HC.fetchOrderById(orderId);
    } else {
      const visibleOrders = await HC.getVisibleOrders();
      order = visibleOrders[0] || null;
    }

    if (order) {
      order = normalizeOrderForPage(order);
    }

    render();
  } catch (error) {
    console.error("Unable to load order:", error);

    if (details) {
      details.hidden = true;
    }

    if (missing) {
      missing.hidden = false;
      missing.innerHTML = `
        <h2>Order not found</h2>
        <p>${HC.escapeHtml(error.message || "Unable to load this order.")}</p>
        <a class="btn btn-primary" href="order-history.html">Order history</a>
      `;
    }

    HC.showToast(error.message || "Unable to load this order.", "error");
  }

  function showLoading() {
    if (details) {
      details.hidden = false;
      details.innerHTML = `
        <p class="muted">Loading order details...</p>
      `;
    }

    if (missing) {
      missing.hidden = true;
    }
  }

  function normalizeOrderForPage(rawOrder) {
    const orderId =
      rawOrder.OrderID ||
      rawOrder.orderID ||
      rawOrder.orderId ||
      rawOrder.id ||
      "Unknown order";

    const createdAt =
      rawOrder.OrderDate ||
      rawOrder.orderDate ||
      rawOrder.createdAt ||
      rawOrder.created_at ||
      null;

    const status =
      rawOrder.Status ||
      rawOrder.status ||
      "Order received";

    const paymentMethod =
      rawOrder.PmtType ||
      rawOrder.paymentMethod ||
      rawOrder.pmtType ||
      "Not available";

    const pickupTime =
      rawOrder.PickupTime ||
      rawOrder.pickupTime ||
      null;

    const rawItems =
      rawOrder.items ||
      rawOrder.orderItems ||
      rawOrder.OrderItems ||
      [];

    const items = rawItems.map((item) => {
      const quantity = Number(
        item.Quantity ||
        item.quantity ||
        1
      );

      const price = Number(
        item.UnitPrice ||
        item.unitPrice ||
        item.price ||
        0
      );

      const name =
        item.ItemName ||
        item.itemName ||
        item.name ||
        item.ItemDesc ||
        item.ItemCode ||
        item.itemCode ||
        "Menu item";

      return {
        ...item,
        name,
        quantity,
        price,
        stallId:
          item.StallID ||
          item.stallId ||
          item.stallID ||
          null,
        stallName:
          item.StallName ||
          item.stallName ||
          item.StallID ||
          item.stallId ||
          "Food stall",
        total: quantity * price
      };
    });

    const existingTotal =
      rawOrder.Total ||
      rawOrder.total ||
      rawOrder.OrderTotal ||
      rawOrder.orderTotal;

    const calculatedTotal = items.reduce((sum, item) => {
      return sum + item.total;
    }, 0);

    return {
      ...rawOrder,
      id: String(orderId),
      OrderID: String(orderId),
      createdAt,
      status,
      paymentMethod,
      pickupTime,
      items,
      total: existingTotal !== undefined && existingTotal !== null
        ? Number(existingTotal) || calculatedTotal
        : calculatedTotal
    };
  }

  function render() {
    if (!order) {
      if (details) {
        details.hidden = true;
      }

      if (missing) {
        missing.hidden = false;
      }

      return;
    }

    const currentIndex = Math.max(
      0,
      statusSteps.indexOf(order.status)
    );

    const stallNames = [
      ...new Set(order.items.map((item) => item.stallName || "Food stall"))
    ];

    const estimate =
      order.status === "Completed"
        ? "Collected"
        : `${Math.max(2, 18 - currentIndex * 5)} minutes`;

    if (details) {
      details.hidden = false;
    }

    if (missing) {
      missing.hidden = true;
    }

    details.innerHTML = `
      <div class="order-header">
        <div>
          <span class="eyebrow">Order ${HC.escapeHtml(order.id)}</span>
          <h2>${stallNames.map((stallName) => HC.escapeHtml(stallName)).join(", ")}</h2>
          <p class="muted">Placed ${HC.formatDate(order.createdAt, true)}</p>
        </div>

        <span class="badge ${order.status === "Completed" ? "badge-success" : "badge-info"}">
          ${HC.escapeHtml(order.status)}
        </span>
      </div>

      <div class="status-tracker" aria-label="Order progress">
        ${statusSteps.map((step, index) => `
          <div class="status-step ${index <= currentIndex ? "complete" : ""}">
            ${index + 1}. ${HC.escapeHtml(step)}
          </div>
        `).join("")}
      </div>

      <div class="grid grid-2">
        <div>
          <h3>Items</h3>
          ${
            order.items.length
              ? order.items.map((item) => `
                  <p>${item.quantity} × ${HC.escapeHtml(item.name)}</p>
                `).join("")
              : `<p class="muted">No item details available.</p>`
          }
        </div>

        <div>
          <h3>Order details</h3>
          <p><strong>Payment:</strong> ${HC.escapeHtml(order.paymentMethod)}</p>
          ${
            order.pickupTime
              ? `<p><strong>Pickup:</strong> ${HC.escapeHtml(HC.formatDate(order.pickupTime, true))}</p>`
              : ""
          }

          <h3>Estimated collection</h3>
          <p class="price">${HC.escapeHtml(estimate)}</p>
          <p>Total: ${HC.formatCurrency(order.total)}</p>
        </div>
      </div>

      <div class="card-actions">
        <button
          class="btn btn-primary"
          id="nextStatus"
          type="button"
          ${currentIndex === statusSteps.length - 1 ? "disabled" : ""}
        >
          Simulate next status
        </button>

        <a class="btn btn-muted" href="order-history.html">Back to history</a>
      </div>
    `;

    document.getElementById("nextStatus")?.addEventListener("click", advanceStatus);
  }

  function advanceStatus() {
    const currentIndex = Math.max(
      0,
      statusSteps.indexOf(order.status)
    );

    if (currentIndex >= statusSteps.length - 1) {
      return;
    }

    order.status = statusSteps[currentIndex + 1];

    HC.showToast(`Order moved to: ${order.status}`);

    render();
  }
});