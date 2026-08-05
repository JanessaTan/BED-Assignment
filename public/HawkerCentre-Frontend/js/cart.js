document.addEventListener("DOMContentLoaded", function initialiseCart() {
  if (!HC.initPage("cart", ["customer", "guest"])) return;

  const groupsTarget = document.getElementById("cartGroups");
  const summaryTarget = document.getElementById("cartSummary");
  const emptyState = document.getElementById("cartEmpty");

  function render() {
    const cart = HC.getCart();
    const summary = HC.getCartSummary(cart);
    const grouped = cart.reduce((groups, line) => {
      if (!groups[line.stallId]) groups[line.stallId] = [];
      groups[line.stallId].push(line);
      return groups;
    }, {});

    emptyState.hidden = cart.length > 0;
    groupsTarget.hidden = cart.length === 0;
    summaryTarget.hidden = cart.length === 0;

    groupsTarget.innerHTML = Object.entries(grouped).map(([stallId, lines]) => {
      const stall = HC.getStallById(stallId);
      const stallSubtotal = lines.reduce((sum, line) => sum + HC.calculateLineTotal(line), 0);
      return `
        <article class="card cart-stall-group">
          <div class="row-between"><div><span class="eyebrow">Separate stall order</span><h2>${HC.escapeHtml(stall?.name || "Food stall")}</h2></div><strong>${HC.formatCurrency(stallSubtotal)}</strong></div>
          ${lines.map((line) => `
            <div class="cart-line" data-line="${line.cartLineId}">
              <div><h3>${HC.escapeHtml(line.name)}</h3><p class="muted">${(line.addOns || []).length ? `Add-ons: ${line.addOns.map((addOn) => HC.escapeHtml(addOn.name)).join(", ")}` : "No add-ons"}${line.promotionTitle ? `<br><span class="text-success">Promotion: ${HC.escapeHtml(line.promotionTitle)}</span>` : ""}</p></div>
              <div class="quantity-control"><button type="button" data-action="decrease" aria-label="Decrease ${HC.escapeHtml(line.name)}">−</button><output>${line.quantity}</output><button type="button" data-action="increase" aria-label="Increase ${HC.escapeHtml(line.name)}">+</button></div>
              <div class="line-price"><strong>${HC.formatCurrency(HC.calculateLineTotal(line))}</strong><br><button class="btn btn-danger" type="button" data-action="remove">Remove</button></div>
            </div>`).join("")}
        </article>`;
    }).join("");

    summaryTarget.innerHTML = `
      <h2>Order summary</h2>
      <div class="summary-row"><span>Items (${summary.itemCount})</span><strong>${HC.formatCurrency(summary.itemSubtotal)}</strong></div>
      <div class="summary-row"><span>Packaging (${Object.keys(grouped).length} stalls)</span><strong>${HC.formatCurrency(summary.packaging)}</strong></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${HC.formatCurrency(summary.total)}</strong></div>
      <div class="stack">
        <a class="btn btn-primary" href="checkout.html">Continue to checkout</a>
        <a class="btn btn-muted" href="browse-hawker-centres.html">Continue shopping</a>
      </div>`;
    HC.updateCartCount();
  }

  groupsTarget.addEventListener("click", function updateCart(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const lineId = event.target.closest("[data-line]")?.dataset.line;
    if (!action || !lineId) return;

    const cart = HC.getCart();
    const line = cart.find((item) => item.cartLineId === lineId);
    if (!line) return;

    if (action === "increase") line.quantity = Math.min(20, line.quantity + 1);
    if (action === "decrease") line.quantity = Math.max(1, line.quantity - 1);
    const updated = action === "remove" ? cart.filter((item) => item.cartLineId !== lineId) : cart;
    HC.saveCart(updated);
    render();
  });

  render();
});
