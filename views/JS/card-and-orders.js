// assets/js/cart.js

//initialize store from local storage / create empty structure
let store = JSON.parse(localStorage.getItem("store")) || { cart: [], order: null };

function saveStore() {
    localStorage.setItem("store", JSON.stringify(store));
}

function getCart() { 
    return store.cart || [];
}

function setCart(cart) { 
    store.cart = cart; 
    saveStore();
}

function clearCart() { 
    store.cart = []; 
    saveStore(); 
}

function cartTotals() {
    const cart = getCart();
    let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { cart, subtotal };
}

function getOrder() {
    return store.order || { type: 'now' };
}

function setOrder(order) {
    store.order = order;
    saveStore();
}

function clearOrder() {
    store.order = null;
    saveStore();
}
function getPickedPromo() { return store.selectedPromo || null; }
function pickPromo(id) { store.selectedPromo = { id }; saveStore(); }
