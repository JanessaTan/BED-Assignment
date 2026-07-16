/*  Student ID - S10275480F 
Student Name -Nicole Agnes Sim Hui En */

// Auto-apply Promotion - Shows the discount when customer checks out with a promotion selected
(function() {
  // Fetch the customer's cart items and total price from the cart module
  const {cart, subtotal} = cartTotals();
  
  // Get the promotion that the customer picked earlier
  const picked = getPickedPromo();
  
  // Calculate how much discount the customer gets with this promotion
  const result = computeDiscount(cart, subtotal);
  
  // Get the HTML elements where we'll display the promo info and details
  const rootEl = $('#root');
  const detailsEl = $('#promoDetails');
  
  // If customer's cart is empty, show a message and button to browse menu
  if (cart.length === 0) {
    rootEl.innerHTML = `
      <div class="promo-status warning">
        <h3>⚠️ Cart is Empty</h3>
        <p>Add items to your cart to see promotion eligibility.</p>
      </div>
      <div class="button-group mt-16">
        <a class="btn" href="menu.html">Browse Menu</a>
      </div>
    `;
    return;
  }
  
  // Get the name of the selected promotion (or "None" if they didn't pick one)
  const promoName = picked 
    ? PROMOTIONS.find(x => x.id === picked.id).title 
    : 'None';
  
  // Check if the promotion was actually applied to their cart
  const isApplied = result.discount > 0;
  // Calculate the new total after subtracting the discount
  const newTotal = Math.max(0, subtotal - result.discount);
  
  // Change the display colors based on whether the discount worked
  let statusClass = isApplied ? 'success' : 'info';
  let statusIcon = isApplied ? '✓' : 'ℹ️';
  
  // Display the promotion summary with prices breakdown
  rootEl.innerHTML = `
    <div class="promo-summary">
      <div class="promo-item">
        <span class="promo-label">Selected Promotion:</span>
        <span class="promo-value"><strong>${promoName}</strong></span>
      </div>
      
      <div class="promo-status ${statusClass}">
        <h3>${statusIcon} ${isApplied ? 'Promotion Applied!' : 'Eligibility Check'}</h3>
        <p>${result.reason}</p>
      </div>
      
      <div class="price-breakdown">
        <div class="price-row">
          <span>Subtotal:</span>
          <span>${fmt(subtotal)}</span>
        </div>
        
        <div class="price-row discount">
          <span>Promotion Discount:</span>
          <span>-${fmt(result.discount)}</span>
        </div>
        
        <hr>
        
        <div class="price-row total">
          <span>New Total:</span>
          <span>${fmt(newTotal)}</span>
        </div>
      </div>
      
      ${isApplied ? `
        <div class="savings-badge">
          🎉 You're saving ${fmt(result.discount)}!
        </div>
      ` : ''}
    </div>
  `;
  
  // If a promotion was actually selected, show more details about it
  if (picked) {
    const promo = PROMOTIONS.find(x => x.id === picked.id);
    detailsEl.classList.remove('hidden');
    
    let detailsHTML = `
      <h3>Promotion Details</h3>
      <div class="promo-details-content">
        <p><strong>Type:</strong> ${
          promo.type === 'order' ? 'Order-wide discount' :
          promo.type === 'stall' ? 'Stall-specific discount' :
          'Bundle deal'
        }</p>
    `;
    
    // Add minimum spend requirement if the promo has one
    if (promo.minSpend) {
      detailsHTML += `<p><strong>Minimum Spend:</strong> ${fmt(promo.minSpend)}</p>`;
    }
    
    // Show percentage discount if it's a percent-based promotion
    if (promo.percent) {
      detailsHTML += `<p><strong>Discount:</strong> ${promo.percent}% off</p>`;
    }
    
    // Show fixed amount discount if it's a flat amount promotion
    if (promo.amount) {
      detailsHTML += `<p><strong>Discount:</strong> ${fmt(promo.amount)} off</p>`;
    }
    
    detailsHTML += `</div>`;
    detailsEl.innerHTML = detailsHTML;
  }
})();