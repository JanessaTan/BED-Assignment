document.addEventListener("DOMContentLoaded", function() {

  const container = document.getElementById("savedList");

  const DEMO_ORDERS = [
    {
      id: "demo1",
      name: "My Usual Chicken Rice",
      items: [
        { name: "Hainanese Chicken Rice", qty: 1, price: 5.00, notes: "Less rice, extra chilli" }
      ]
    },
    {
      id: "demo2",
      name: "Friday Treat",
      items: [
        { name: "Laksa", qty: 1, price: 5.50, notes: "More sambal" },
        { name: "Kopi O", qty: 1, price: 1.50, notes: "Less sugar" }
      ]
    }
  ];

  let savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders"));

  if (!savedOrders || savedOrders.length === 0) {
    savedOrders = DEMO_ORDERS;
    localStorage.setItem("hc.savedOrders", JSON.stringify(savedOrders));
  }

  render();

  function render() {

    savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders")) || [];

    if(savedOrders.length === 0){
      container.innerHTML = "<p>No saved orders yet.</p>";
      return;
    }

    container.innerHTML = savedOrders.map(order => {

      const totalPrice = order.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        return sum + (price * item.qty);
      }, 0);

      return `
        <div class="saved-order-card">
          <h3>${order.name}</h3>

          <div id="view-${order.id}">
            <ul>
              ${order.items.map(item => `
                <li>
                  ${item.name} (x${item.qty}) 
                  - $${((Number(item.price) || 0) * item.qty).toFixed(2)}
                  <br/>
                  <small>${item.notes || ""}</small>
                </li>
              `).join("")}
            </ul>

            <p><strong>Total: $${totalPrice.toFixed(2)}</strong></p>
          </div>

          <div id="edit-${order.id}" style="display:none;">
            ${order.items.map((item,i) => `
              <div class="edit-item">
                <strong>${item.name}</strong><br/>
                Qty:
                <input type="number" min="1" value="${item.qty}" id="qty-${order.id}-${i}">
                <br/>
                Notes:
                <input type="text" value="${item.notes || ""}" id="notes-${order.id}-${i}">
              </div>
            `).join("")}
            <button onclick="saveEdit('${order.id}')">Save Changes</button>
          </div>

          <button onclick="orderAgain('${order.id}')">Order Again</button>
          <button onclick="toggleEdit('${order.id}')">Edit</button>
          <button onclick="deleteOrder('${order.id}')">Delete</button>
        </div>
      `;
    }).join("");
  }

  window.orderAgain = function(id) {

  const savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders")) || [];
  const selected = savedOrders.find(o => o.id === id);
  if (!selected) return;

  const cartItems = selected.items.map(item => ({
    name: item.name,
    qty: item.qty,
    price: Number(item.price) || 0,
    notes: item.notes
  }));

  // Checkout reads from "store"
  let store = JSON.parse(localStorage.getItem("store")) || { cart: [], order: { type: "now" } };

  store.cart = cartItems;

  localStorage.setItem("store", JSON.stringify(store));

  window.location.href = "Checkout.html";
  };


  window.toggleEdit = function(id) {
    const viewDiv = document.getElementById("view-" + id);
    const editDiv = document.getElementById("edit-" + id);

    if (editDiv.style.display === "none") {
      editDiv.style.display = "block";
      viewDiv.style.display = "none";
    } else {
      editDiv.style.display = "none";
      viewDiv.style.display = "block";
    }
  };

  window.saveEdit = function(id) {

    let savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders")) || [];
    const order = savedOrders.find(o => o.id === id);
    if (!order) return;

    order.items.forEach((item,i) => {
      const qtyInput = document.getElementById(`qty-${id}-${i}`);
      const notesInput = document.getElementById(`notes-${id}-${i}`);
      item.qty = parseInt(qtyInput.value);
      item.notes = notesInput.value;
    });

    localStorage.setItem("hc.savedOrders", JSON.stringify(savedOrders));
    render();
  };

  window.deleteOrder = function(id) {

    let savedOrders = JSON.parse(localStorage.getItem("hc.savedOrders")) || [];

    savedOrders = savedOrders.filter(o => o.id !== id);

    if(savedOrders.length === 0){
      savedOrders = DEMO_ORDERS; 
    }

    localStorage.setItem("hc.savedOrders", JSON.stringify(savedOrders));
    render();
  };

});