document.addEventListener("DOMContentLoaded", function initialiseCheckout() {
  "use strict";

  if (!HC.initPage("cart", ["customer"])) return;

  const cart = HC.getCart();
  if (!cart.length) {
    window.location.replace("cart.html");
    return;
  }

  const form = document.getElementById("checkoutForm");
  const collectionMethodInput = document.getElementById("collectionMethod");
  const pickupTimeGroup = document.getElementById("pickupTimeGroup");
  const pickupTimeInput = document.getElementById("pickupTime");
  const customerNameInput = document.getElementById("customerName");
  const currentUser = HC.getCurrentUser();

  if (customerNameInput && currentUser?.name) {
    customerNameInput.value = currentUser.name;
  }

  function localDateTimeValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  if (pickupTimeInput?.type === "datetime-local") {
    pickupTimeInput.min = localDateTimeValue(new Date());
  }

  function setError(id, text) {
    const target = document.getElementById(id);
    if (target) target.textContent = text;
  }

  function updatePickupVisibility() {
    if (!pickupTimeGroup || !pickupTimeInput || !collectionMethodInput) return;

    const selfCollection = collectionMethodInput.value === "Self collection";
    pickupTimeGroup.style.display = selfCollection ? "block" : "none";
    pickupTimeInput.required = selfCollection;

    if (!selfCollection) {
      pickupTimeInput.value = "";
      setError("pickupTimeError", "");
    }
  }

  function toPickupDateTime(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) return null;
    return parsed.toISOString();
  }

  function renderSummary() {
    const summary = HC.getCartSummary(cart);
    const target = document.getElementById("checkoutSummary");
    if (!target) return;

    target.innerHTML = `
      <h2>Order summary</h2>
      <div class="stack">
        ${cart.map((item) => `
          <div class="row-between">
            <span>${item.quantity} × ${HC.escapeHtml(item.name)}</span>
            <strong>${HC.formatCurrency(HC.calculateLineTotal(item))}</strong>
          </div>
        `).join("")}
      </div>
      <hr>
      <div class="summary-row"><span>Items</span><strong>${HC.formatCurrency(summary.itemSubtotal)}</strong></div>
      <div class="summary-row"><span>Packaging</span><strong>${HC.formatCurrency(summary.packaging)}</strong></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${HC.formatCurrency(summary.total)}</strong></div>`;
  }

  collectionMethodInput?.addEventListener("change", updatePickupVisibility);
  updatePickupVisibility();

  form?.addEventListener("submit", async function placeOrder(event) {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const collectionMethod = collectionMethodInput?.value || "";
    const rawPickupTime = pickupTimeInput?.value || null;

    if (!HC.getAuthToken()) {
      HC.showToast("Please log in as a customer before placing the order.", "error");
      window.location.href = "login.html?next=checkout.html";
      return;
    }

    if (!collectionMethod) {
      setError("collectionMethodError", "Please select a collection method.");
      HC.showToast("Please select a collection method.", "error");
      return;
    }

    if (!paymentMethod) {
      setError("paymentMethodError", "Please select a payment method.");
      HC.showToast("Please select a payment method.", "error");
      return;
    }

    if (collectionMethod === "Self collection" && !rawPickupTime) {
      setError("pickupTimeError", "Please select a pickup time.");
      HC.showToast("Please select a pickup time for self-collection.", "error");
      return;
    }

    const pickupTime = collectionMethod === "Self collection"
      ? toPickupDateTime(rawPickupTime)
      : null;

    if (collectionMethod === "Self collection" && !pickupTime) {
      setError("pickupTimeError", "Pickup time must be in the future.");
      HC.showToast("Pickup time must be in the future.", "error");
      return;
    }

    const items = cart.map((item) => ({
      stallId: Number(item.stallId),
      menuItemId: Number(item.menuItemId),
      quantity: Number(item.quantity)
    }));

    const hasInvalidItem = items.some((item) =>
      !Number.isInteger(item.stallId) || item.stallId <= 0 ||
      !Number.isInteger(item.menuItemId) || item.menuItemId <= 0 ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
    );

    if (hasInvalidItem) {
      console.error("Invalid database cart IDs:", cart);
      HC.showToast(
        "A cart item has invalid database IDs. Remove it and add it again from the menu page.",
        "error"
      );
      return;
    }

    const orderData = {
      pmtType: paymentMethod,
      pickupTime,
      items
    };

    try {
      if (submitButton) submitButton.disabled = true;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HC.getAuthToken()}`
        },
        body: JSON.stringify(orderData)
      });

      const responseText = await response.text();

      let result = null;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {
          message: responseText || "The server returned an invalid response."
        };
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          `Checkout failed with status ${response.status}.`
        );
      }

      const orderId =
        result?.OrderID ??
        result?.orderId ??
        result?.data?.OrderID ??
        result?.data?.orderId;

      if (!orderId) {
        throw new Error("The checkout API did not return an OrderID.");
      }

      HC.saveCart([]);
      sessionStorage.setItem("hc.latestOrder", String(orderId));

      window.location.href =
        `order-success.html?order=${encodeURIComponent(orderId)}`;
    } catch (error) {
      console.error("Checkout failed:", error);
      HC.showToast(error.message || "Unable to place the order.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  renderSummary();
});
