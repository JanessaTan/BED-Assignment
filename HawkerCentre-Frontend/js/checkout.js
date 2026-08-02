document.addEventListener("DOMContentLoaded", function initialiseCheckout() {
    if (!HC.initPage("cart", ["customer", "guest"])) return;
    const cart = HC.getCart();
    if (!cart.length) {
        window.location.replace("cart.html");
        return;
    }
    const currentUser = HC.getCurrentUser();
    if (currentUser?.name !== "Guest") {
        document.getElementById("customerName").value = currentUser.name;
    }

    // Add pickup time show/hide logic here
    const collectionMethodInput = document.getElementById("collectionMethod");
    const pickupTimeGroup = document.getElementById("pickupTimeGroup");
    const pickupTimeInput = document.getElementById("pickupTime");
    
    if (collectionMethodInput && pickupTimeGroup && pickupTimeInput) {
    pickupTimeGroup.style.display = "none";
    
    collectionMethodInput.addEventListener("change", function () {
    if (collectionMethodInput.value === "Self collection") {
    pickupTimeGroup.style.display = "block";
    } else {
    pickupTimeGroup.style.display = "none";
    pickupTimeInput.value = "";
    setError("pickupTimeError", "");
    }
    });
    }

    function renderSummary() {
        const summary = HC.getCartSummary(cart);
        document.getElementById("checkoutSummary").innerHTML = `
            <h2>Order summary</h2>
            <div class="stack">
                ${cart.map(item => `
                    <div class="row-between">
                        <span>
                            ${item.quantity} × ${HC.escapeHtml(item.name)}
                        </span>
                        <strong>
                            ${HC.formatCurrency(
                                item.quantity * item.price
                            )}
                        </strong>
                    </div>
                `).join("")}
            </div>
            <hr>
            <div class="summary-row">
                <span>Total</span>
                <strong>
                    ${HC.formatCurrency(summary.total)}
                </strong>
            </div>
        `;
    }
    function setError(id,text){
        document.getElementById(id).textContent=text;
    }
    document.getElementById("checkoutForm").addEventListener("submit", async function placeOrder(event){

        event.preventDefault();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        if (!paymentMethod) {
            alert("Please select a payment method.");
            return;
        }
        const pickupTimeInput = document.getElementById("pickupTime");
        const pickupTime = pickupTimeInput ? pickupTimeInput.value : null;
        
        if (collectionMethodInput.value === "Self collection" && !pickupTime) {
        alert("Please select a pickup time for self-collection.");
        return;
        }
        const currentUser = HC.getCurrentUser();
        const orderData = {
            customerID: currentUser.customerID,
            orderDate: new Date(),
            pmtType: paymentMethod,
            pickupTime: pickupTime,

            items: cart.map(item => ({
            StallID: item.stallId,
            ItemCode: item.menuItemId,
            Quantity: item.quantity,
            UnitPrice: item.price
          }))
        };

        try {
            const response = await fetch("/api/checkout", {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                    //  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body:JSON.stringify(orderData)
            });
            const result = await response.json();
            if(!response.ok){
                throw new Error(result.message);
            }

            localStorage.removeItem("cart");
            window.location.href = `order-success.html?order=${result.OrderID}`;
        }catch(error){
            console.error(
                "Checkout failed:",
                error
            );
            alert(
                "Unable to place order"
            );
        }
    });
    renderSummary();
});