document.addEventListener("DOMContentLoaded", function initialiseOrderHistory() {
  "use strict";

  if (!HC.initPage("history", ["customer"])) return;

  const searchInput = document.getElementById("orderSearch");
  const statusFilter = document.getElementById("statusFilter");
  const dateFilter = document.getElementById("dateFilter");
  const countTarget = document.getElementById("historyCount");
  const emptyTarget = document.getElementById("historyEmpty");
  const resultsTarget = document.getElementById("historyResults");

  let visibleOrders = [];

  async function loadOrderHistory() {
    try {
      if (countTarget) {
        countTarget.textContent = "Loading your orders...";
      }

      if (resultsTarget) {
        resultsTarget.innerHTML = "";
      }

      if (emptyTarget) {
        emptyTarget.hidden = true;
      }

      visibleOrders = await HC.fetchVisibleOrders();

      visibleOrders = visibleOrders.map(normalizeOrderForHistory);

      render();
    } catch (error) {
      console.error("Unable to load order history:", error);

      if (countTarget) {
        countTarget.textContent = "Unable to load order history";
      }

      if (resultsTarget) {
        resultsTarget.innerHTML = "";
      }

      if (emptyTarget) {
        emptyTarget.hidden = false;
        emptyTarget.innerHTML = `
          <h2>Unable to load orders</h2>
          <p>${HC.escapeHtml(error.message || "Your order history could not be loaded.")}</p>
        `;
      }

      HC.showToast(error.message || "Unable to load order history.", "error");
    }
  }

  function normalizeOrderForHistory(rawOrder) {
    const orderId =
      rawOrder.OrderID ||
      rawOrder.orderID ||
      rawOrder.orderId ||
      rawOrder.id ||
      "";

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
        menuItemId:
          item.menuItemId ||
          item.menu_item_id ||
          null,
        total: quantity * price
      };
    });

    const total = items.reduce((sum, item) => {
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
      total
    };
  }

  function render() {
    const search = String(searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "";
    const date = dateFilter?.value || "";

    const filteredOrders = visibleOrders.filter((order) => {
      const orderDate = order.createdAt ? String(order.createdAt).slice(0, 10) : "";

      const matchesId = order.id.toLowerCase().includes(search);
      const matchesStatus = !status || order.status === status;
      const matchesDate = !date || orderDate === date;

      return matchesId && matchesStatus && matchesDate;
    });

    if (countTarget) {
      countTarget.textContent = `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} found`;
    }

    if (emptyTarget) {
      emptyTarget.hidden = filteredOrders.length > 0;
      emptyTarget.innerHTML = `
        <h2>No orders found</h2>
        <p>Adjust your filters or place an order.</p>
      `;
    }

    if (!resultsTarget) return;

    resultsTarget.innerHTML = filteredOrders
      .map((order) => renderOrderCard(order))
      .join("");
  }

  function renderOrderCard(order) {
    const orderId = order.id || order.OrderID;

    const itemSummary = order.items.length
      ? order.items
          .map((item) => `${item.quantity} × ${HC.escapeHtml(item.name)}`)
          .join(" · ")
      : "No item details available";

    return `
      <article class="card history-card" data-order="${HC.escapeHtml(orderId)}">
        <div>
          <div class="row-between">
            <h2>${HC.escapeHtml(orderId)}</h2>
            <span class="badge ${order.status === "Completed" ? "badge-success" : "badge-info"}">
              ${HC.escapeHtml(order.status)}
            </span>
          </div>

          <p class="history-items">${itemSummary}</p>

          <p class="muted">
            ${HC.formatDate(order.createdAt, true)} · ${HC.formatCurrency(order.total)}
          </p>
        </div>

        <div class="card-actions">
          <button
            class="btn btn-primary"
            type="button"
            data-view-order="${HC.escapeHtml(orderId)}"
          >
            View details
          </button>

          <button
            class="btn btn-outline"
            type="button"
            data-reorder="${HC.escapeHtml(orderId)}"
          >
            Reorder
          </button>
        </div>
      </article>
    `;
  }

  [searchInput, statusFilter, dateFilter].forEach((element) => {
    if (!element) return;

    element.addEventListener(
      element === searchInput ? "input" : "change",
      render
    );
  });

  resultsTarget?.addEventListener("click", function handleOrderHistoryClick(event) {
    const viewButton = event.target.closest("[data-view-order]");

    if (viewButton) {
      const orderId = viewButton.dataset.viewOrder;

      if (!orderId) return;

      window.location.href = `order.html?order=${encodeURIComponent(orderId)}`;
      return;
    }

    const reorderButton = event.target.closest("[data-reorder]");

    if (!reorderButton) return;

    const orderId = reorderButton.dataset.reorder;

    const order = visibleOrders.find((candidate) => {
      return candidate.id === orderId || candidate.OrderID === orderId;
    });

    if (!order) return;

    const canReorder = order.items.every((item) => {
      return Number.isInteger(Number(item.stallId)) &&
        Number.isInteger(Number(item.menuItemId));
    });

    if (!canReorder) {
      HC.showToast(
        "This order cannot be reordered yet because its database items do not include menuItemId mapping.",
        "error"
      );
      return;
    }

    const currentCart = HC.getCart();

    const reorderedLines = order.items.map((item) => ({
      ...item,
      cartLineId: `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }));

    HC.saveCart([...currentCart, ...reorderedLines]);
    HC.showToast("Items added back to your cart.");

    window.setTimeout(() => {
      window.location.href = "cart.html";
    }, 450);
  });

  loadOrderHistory();
});