/* assets/js/checkout.js */

document.addEventListener("DOMContentLoaded", function () {

  console.log("Checkout page loaded");

  displayCheckout();

  // Back button
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.location.href = "Menu.html";
    });
  }

  // Promo link
  const promoLink = document.querySelector(".promo-link");
  if (promoLink) {
    promoLink.addEventListener("click", function () {
      window.location.href = "Promotion.html";
    });
  }

  // Payment form
  const paymentForm = document.querySelector(".payment-form");

  if (paymentForm) {
    paymentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const cardNumber = document.querySelector("#card-number").value.trim();
      const expiry = document.querySelector("#expiry").value.trim();
      const cvc = document.querySelector("#cvc").value.trim();

      const cardRegex = /^\d{16}$/;
      const expiryRegex = /^\d{2}\/\d{2}$/;
      const cvcRegex = /^\d{3}$/;

      if (!cardRegex.test(cardNumber) ||
          !expiryRegex.test(expiry) ||
          !cvcRegex.test(cvc)) {

        alert("Invalid payment details.");
        return;
      }

      clearCart();
      clearOrder();

      alert("Payment successful!");
      window.location.href = "Success.html";
    });
  }

});


//display checkout
function displayCheckout() {

  const cartDiv = document.querySelector(".cart-list");
  const totalDiv = document.querySelector(".cart-total");
  const orderDiv = document.querySelector(".order-info");

  if (!cartDiv || !totalDiv || !orderDiv) {
    console.log("Checkout elements missing in HTML");
    return;
  }

  const store = JSON.parse(localStorage.getItem("store")) || {
    cart: [],
    order: { type: "now" }
  };

  const cart = store.cart || [];
  const order = store.order || { type: "now" };

  console.log("Cart data:", cart);
//order info
  if (order.type === "later" && order.pickupTime) {
    const d = new Date(order.pickupTime);
    orderDiv.innerHTML =
      "<p><strong>Pickup Time:</strong> " +
      d.toLocaleString() +
      "</p>";
  } else {
    orderDiv.innerHTML =
      "<p><strong>Pickup:</strong> ASAP</p>";
  }

  //empty cart
  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>";
    totalDiv.innerHTML = "";
    return;
  }

  cartDiv.innerHTML = "";

  let subtotal = 0;

 //display items
  cart.forEach(function (item, index) {

    subtotal += Number(item.price) * item.qty;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("cart-item");

    let customizationHTML = "";

    if (item.size) {
      customizationHTML += "<p><strong>Size:</strong> " + item.size + "</p>";
    }

    if (item.spice) {
      customizationHTML += "<p><strong>Spice:</strong> " + item.spice + "</p>";
    }

    if (item.addons && item.addons.length > 0) {
      customizationHTML +=
        "<p><strong>Add-ons:</strong> " +
        item.addons.join(", ") +
        "</p>";
    }

    if (item.notes) {
      customizationHTML +=
        "<p><strong>Notes:</strong> " +
        item.notes +
        "</p>";
    }

    itemDiv.innerHTML =
      "<div class='item-info'>" +
      "<h4>" + item.name + "</h4>" +
      "<p>$" + item.price + " x " + item.qty + "</p>" +
      customizationHTML +
      "</div>" +
      "<div class='item-actions'>" +
      "<span class='item-price'>$" +
      (item.price * item.qty).toFixed(2) +
      "</span>" +
      "<button class='delete-btn' type='button'>Remove</button>" +
      "<button class='customize-btn' type='button'>Customize</button>" +
      "</div>";

    cartDiv.appendChild(itemDiv);

    // Remove button
    const removeBtn = itemDiv.querySelector(".delete-btn");
    removeBtn.style.cursor = "pointer";
    removeBtn.style.backgroundColor = "white";
    removeBtn.style.color = "red";
    removeBtn.style.border = "1px solid blue";
    removeBtn.style.borderRadius = "5px";
    removeBtn.style.padding = "3px 6px";
    removeBtn.style.marginLeft = "10px";
    removeBtn.style.fontWeight = "bold";
    
    removeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      const store = JSON.parse(localStorage.getItem("store")) || { cart: [] };
      const currentCart = store.cart || [];

      if (currentCart[index].qty > 1) {
        currentCart[index].qty -= 1;
      } else {
        currentCart.splice(index, 1);
      }

      store.cart = currentCart;
      localStorage.setItem("store", JSON.stringify(store));

      displayCheckout();
    });

    // Customize button
    const customizeBtn = itemDiv.querySelector(".customize-btn");
    customizeBtn.style.cursor = "pointer";
    customizeBtn.style.backgroundColor = "white";
    customizeBtn.style.color = "red";
    customizeBtn.style.border = "1px solid blue";
    customizeBtn.style.borderRadius = "5px";
    customizeBtn.style.padding = "3px 6px";
    customizeBtn.style.marginLeft = "10px";
    customizeBtn.style.fontWeight = "bold";
    
    customizeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      console.log('Customize clicked for item index:', index);
      
      // Store the index of the item being edited
      try {
        localStorage.setItem("editingCartIndex", String(index));
        console.log('Set editingCartIndex to:', index);
      } catch (err) {
        console.error('Error setting editingCartIndex:', err);
        alert('Error: Could not save item index. Please try again.');
        return;
      }

      // Navigate to customize page
      window.location.href = "customize.html";
    });

  });

  //calculate promo
  let discount = 0;
  let reason = "";

  if (typeof computeDiscount === "function") {
    const promoResult = computeDiscount(cart, subtotal);
    discount = promoResult.discount || 0;
    reason = promoResult.reason || "";
  }

  const finalTotal = Math.max(0, subtotal - discount);

  let totalHTML =
    "<h3>Subtotal: $" + subtotal.toFixed(2) + "</h3>";

  if (discount > 0) {
    totalHTML +=
      "<p style='color:green;'>Discount: -$" +
      discount.toFixed(2) +
      "</p>";
  }

  if (reason) {
    totalHTML +=
      "<p style='font-size:0.9em;color:#666;'>" +
      reason +
      "</p>";
  }

  totalHTML +=
    "<h2 style='color:red;'>Final Total: $" +
    finalTotal.toFixed(2) +
    "</h2>";

  totalDiv.innerHTML = totalHTML;
}