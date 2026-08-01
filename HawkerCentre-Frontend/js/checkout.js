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
    function renderSummary() {
        const summary = HC.getCartSummary(cart);
        document.getElementById("checkoutSummary").innerHTML = `
            <h2>Order summary</h2>
            <div class="stack">
                ${cart.map(item => `
                    <div class="row-between">
                        <span>
                            ${item.Quantity} × ${HC.escapeHtml(item.name)}
                        </span>
                        <strong>
                            ${HC.formatCurrency(
                                item.Quantity * item.UnitPrice
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
        const paymentMethod =
            document.querySelector('input[name="paymentMethod"]:checked')?.value;
        const orderData = {
            orderDate: new Date(),
            pmtType: paymentMethod,
            customerID: currentUser?.id || null,
            items: cart
        };
        try {
            const response = await fetch("/api/checkout", {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
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