document.addEventListener("DOMContentLoaded", function initialiseCheckout() {
  if (!HC.initPage("cart", ["customer", "guest"])) return;
  const cart = HC.getCart();
  if (!cart.length) {
    window.location.replace("cart.html");
    return;
  }

  const currentUser = HC.getCurrentUser();
  if (currentUser?.name !== "Guest") document.getElementById("customerName").value = currentUser.name;

  function renderSummary() {
    const summary = HC.getCartSummary(cart);
    document.getElementById("checkoutSummary").innerHTML = `
      <h2>Order summary</h2>
      <div class="stack">${cart.map((line) => `<div class="row-between"><span>${line.quantity} × ${HC.escapeHtml(line.name)}</span><strong>${HC.formatCurrency(HC.calculateLineTotal(line))}</strong></div>`).join("")}</div>
      <hr>
      <div class="summary-row"><span>Items</span><strong>${HC.formatCurrency(summary.itemSubtotal)}</strong></div>
      <div class="summary-row"><span>Packaging</span><strong>${HC.formatCurrency(summary.packaging)}</strong></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${HC.formatCurrency(summary.total)}</strong></div>
      <p class="notice">Payment options are simulated. No bank connection is used.</p>`;
  }

  function setError(id, text) {
    document.getElementById(id).textContent = text;
  }

  document.getElementById("checkoutForm").addEventListener("submit", function placeOrder(event) {
    event.preventDefault();
    ["customerNameError", "phoneError", "collectionMethodError", "packagingError", "paymentMethodError"].forEach((id) => setError(id, ""));

    const customerName = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("phone").value.trim().replace(/\s/g, "");
    const collectionMethod = document.getElementById("collectionMethod").value;
    const packaging = document.getElementById("packaging").value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    let valid = true;

    if (customerName.length < 2) {
      setError("customerNameError", "Enter the customer's name.");
      valid = false;
    }
    if (!/^[689]\d{7}$/.test(phone)) {
      setError("phoneError", "Enter a valid 8-digit Singapore contact number.");
      valid = false;
    }
    if (!collectionMethod) {
      setError("collectionMethodError", "Select a collection method.");
      valid = false;
    }
    if (!packaging) {
      setError("packagingError", "Select a packaging preference.");
      valid = false;
    }
    if (!paymentMethod) {
      setError("paymentMethodError", "Select a demonstration payment method.");
      valid = false;
    }
    if (!valid) return;

    const order = HC.createOrder({
      customerName,
      collectionMethod,
      packaging,
      paymentMethod,
      notes: document.getElementById("notes").value.trim(),
      paymentStatus: "Successful"
    });
    window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}`;
  });

  renderSummary();
});
