/* Student ID- S10274395 */
/* Student Name: Than Thar Wint Htal */

/* ===== Hawker Center - Rating JS ===== */

// Demo menu items
const menuItems = [
  { id: "chicken-rice",      name: "Hainanese chicken rice", img: "../img/chicken rice.jpg",      rating: 4.7, bestseller: true,  price: 4.5 },
  { id: "laksa",             name: "Laksa",                   img: "../img/laksa.jpg",             rating: 4.4, bestseller: false, price: 5.0 },
  { id: "char-kway-teow",    name: "Char Kway Teow",          img: "../img/charkwayteow.jpg",    rating: 4.2, bestseller: false, price: 5.5 },
  { id: "sambal-stingray",   name: "Sambal Stingray",         img: "../img/sambal.jpg",   rating: 4.8, bestseller: true,  price: 12.0 },
  { id: "chili-crab",        name: "Chili Crab",              img: "../img/chili_crab.jpg",        rating: 4.6, bestseller: false, price: 38.0 },
  { id: "satay",             name: "Satay",                   img: "../img/satay.jpg",             rating: 4.3, bestseller: false, price: 0.9 },
  { id: "nyonya-kueh",       name: "Nyonya Kueh",             img: "../img/nyonya-kueh.jpg",       rating: 4.5, bestseller: false, price: 1.2 },
  { id: "roti-prata",        name: "Roti Prata",              img: "../img/roti.jpg",        rating: 4.1, bestseller: false, price: 1.5 },
  { id: "fried-carrot-cake", name: "Fried Carrot Cake",       img: "../img/carrot.jpg", rating: 4.0, bestseller: false, price: 3.5 },
  { id: "oyster-omelette",   name: "Oyster Omelette",         img: "../img/Omelette.jpg",   rating: 4.2, bestseller: false, price: 7.0 },
  { id: "popiah",            name: "Popiah",                  img: "../img/popiah.jpg",            rating: 4.0, bestseller: false, price: 2.0 },
  { id: "kaya-toast",        name: "Kaya Toast",              img: "../img/kaya-toast.jpg",        rating: 3.9, bestseller: false, price: 2.2 },
];

/* ===== LocalStorage Cart ===== */
const Cart = (() => {
  const KEY = "hc_cart_v1";

  // read cart from storge
  function _read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  // write cart to storage
  function _write(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));
  }

  function add(item, qty = 1) {
    const cart = _read();
    const idx = cart.findIndex(x => x.id === item.id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price ?? 0, qty });
    }
    _write(cart);
  }


  function get() { return _read(); }
  function clear() { _write([]); }

  return { add, get, clear };
})();


/* ===== Render grid ===== */
const grid = document.getElementById("menuGrid");

function renderGrid(items) {
  grid.innerHTML = ""; // clear first
  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "hc-card";
    card.dataset.itemId = item.id;
    card.dataset.itemName = item.name;

    // Bestseller ribbon 
    if (item.bestseller) {
      const ribbon = document.createElement("div");
      ribbon.className = "hc-ribbon";
      ribbon.textContent = "BESTSELLER";
      card.appendChild(ribbon);
    }

    // Media (image + add-to-cart icon)
    const media = document.createElement("div");
    media.className = "hc-card__media";
    const img = document.createElement("img");
    img.src = item.img;
    img.alt = item.name;
    media.appendChild(img);

    // Add-to-cart icon button
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "hc-add-btn";
    addBtn.setAttribute("data-action", "add-to-cart");
    addBtn.setAttribute("data-id", item.id);
    addBtn.setAttribute("aria-label", `Add ${item.name} to cart`);
    addBtn.innerHTML = cartPlusSVG();
    media.appendChild(addBtn);

    // Content
    const content = document.createElement("div");
    content.className = "hc-card__content";

    const title = document.createElement("h3");
    title.className = "hc-title";
    title.textContent = item.name;

    const rating = document.createElement("div");
    rating.className = "hc-rating";
    rating.appendChild(buildStars(item.rating));
    const num = document.createElement("span");
    num.className = "hc-rating__num";
    num.textContent = Number(item.rating).toFixed(1);
    rating.appendChild(num);

    content.appendChild(title);
    content.appendChild(rating);

    // Assemble
    card.appendChild(media);
    card.appendChild(content);
    grid.appendChild(card);
  });
}

/* ===== Stars ===== */
function buildStars(value) {
  const wrap = document.createElement("span");
  wrap.className = "hc-stars";
  const stars = 5;
  const full = Math.floor(value);
  const rem = value - full;
  const hasHalf = rem >= 0.25 && rem < 0.75;
  const totalFull = rem >= 0.75 ? full + 1 : full;

  for (let i = 0; i < stars; i++) {
    let state = "empty";
    if (i < totalFull) state = "full";
    else if (i === full && hasHalf) state = "half";

    const s = document.createElement("span");
    s.className = `hc-star hc-star--${state}`;
    s.innerHTML = starSVG(state === "half");
    wrap.appendChild(s);
  }
  return wrap;
}

let gradCounter = 0;
function starSVG(isHalf = false){
  gradCounter++;
  const gradId = `grad-half-${gradCounter}`;
  return `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${isHalf ? `
    <defs>
      <linearGradient id="${gradId}">
        <stop offset="50%" stop-color="var(--hc-gold)"/>
        <stop offset="50%" stop-color="#555"/>
      </linearGradient>
    </defs>
  ` : ``}
  <path d="M12 .9l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 16.9l-6.18 3.26L7 13.03 2 8.16l6.91-1L12 .9z"
        fill="${isHalf ? `url(#${gradId})` : 'currentColor'}"
        />
</svg>`;
}

/* === Cart Icon === */
function cartPlusSVG(){
  return `
<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
  <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM3 2h2l2.2 11.1A3 3 0 0 0 10.14 16H18a3 3 0 0 0 2.94-2.37l1-4.63A1 1 0 0 0 21 7h-1.28l-.36 1.72L18 14h-7.86a1 1 0 0 1-.98-.8L7.28 6H21V4H6.62L6.2 2.2A1 1 0 0 0 5.22 2H3Z"></path>
  <path d="M16 3v3h-3v2h3v3h2V8h3V6h-3V3h-2z"></path>
</svg>`;
}

/* ===== Sticky CTA interaction ===== */
document.getElementById("viewMenuBtn")?.addEventListener("click", () => {
  // Replace with navigation or modal in your app
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ===== Add-to-Cart Handler ===== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="add-to-cart"]');
  if (!btn) return;

  
  if (btn.dataset.busy === "1") return;
  btn.dataset.busy = "1";

  const id = btn.getAttribute("data-id");
  const item = menuItems.find(m => m.id === id);
  if (!item) { btn.dataset.busy = "0"; return; }

  // 1) Add to cart 
  Cart.add(item, 1);

  // 2) Announce for screen readers
  const live = document.getElementById("cartLiveRegion");
  if (live) {
    live.textContent = "";
    setTimeout(() => { live.textContent = `${item.name} added to cart`; }, 10);
  }

  // 3) Trigger animations: pop + sparkle + +1 bubble
  animateAddIcon(btn);

  // Release busy flag after animation completes
  setTimeout(() => { btn.dataset.busy = "0"; }, 420);
});

/* Animation */
function animateAddIcon(btn){
  btn.classList.add("is-animating");
  setTimeout(() => btn.classList.remove("is-animating"), 280);

  
  const spark = document.createElement("div");
  spark.className = "hc-sparkle";
  btn.parentElement.appendChild(spark);
  setTimeout(() => spark.remove(), 420);

  
  const bubble = document.createElement("div");
  bubble.className = "hc-bubble";
  bubble.textContent = "+1";
  btn.parentElement.appendChild(bubble);
  

  const btnRect = btn.getBoundingClientRect();
  const mediaRect = btn.parentElement.getBoundingClientRect();
  const centerLeft = (btnRect.left - mediaRect.left) + btnRect.width/2;
  bubble.style.left = `${centerLeft}px`;
  setTimeout(() => bubble.remove(), 540);
}

/* ===== Optional Global Cart API ===== */
window.HC_Cart = {
  add: (id, qty = 1) => {
    const item = menuItems.find(m => m.id === id);
    if (item) Cart.add(item, qty);
  },
  get: () => Cart.get(),
  clear: () => Cart.clear()
};

/* ===== Initialize ===== */
renderGrid(menuItems);