document.addEventListener('DOMContentLoaded', function () {
  const orderNowBtn = document.getElementById("order-now");
  const orderLaterBtn = document.getElementById("order-later");
  const promo = document.querySelector(".Check-promo span");
  const navOrderBtn = document.querySelector(".order-btn button");
  const savedBtn = document.querySelector('.savedOrder-btn'); 

  // Nav buttons
  if (navOrderBtn) {
    navOrderBtn.style.cursor = 'pointer';
    navOrderBtn.addEventListener('click', () => window.location.href = 'Order.html');
  }
//order now btn leads to menu
  if (orderNowBtn) {
    orderNowBtn.style.cursor = "pointer";
    orderNowBtn.addEventListener('click', function() {
      if (typeof setOrder === "function") {
        setOrder({ type: "now", pickupTime: null });
      }
      window.location.href = "Menu.html";
    });
  }
//order later btn leads to order later html
  if (orderLaterBtn) {
    orderLaterBtn.style.cursor = 'pointer';
    orderLaterBtn.addEventListener('click', () => window.location.href = 'order-later.html');
  }
//promotion span leads to promotion page
  if (promo) {
    promo.style.cursor = "pointer";
    promo.addEventListener('click', () => window.location.href = 'Promotion.html');
  }

  // Saved Orders button
  if (savedBtn) {
    savedBtn.style.cursor = 'pointer';
    savedBtn.addEventListener("click", function() {
      const savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders")) || [];
      if (savedOrders.length === 0) {
        alert("There are no saved orders yet.");
        return;
      }
      // Navigate to Saved Orders page if have saved order
      window.location.href = "saved-order.html";
    });
  }
});