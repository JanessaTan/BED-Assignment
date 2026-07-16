(function(){

  const menuList = document.getElementById("menuList");
  const stallId = new URLSearchParams(window.location.search).get("stall");

  // Store menus in one object
  const STALL_MENUS = {

    "golden-wok": [
      {
        name: "Egg Fried Rice",
        description: "Classic wok fried rice with egg.",
        price: 5.00,
        img: "../img/chinese.jpg"
      },
      {
        name: "Char Kway Teow",
        description: "Flat noodles stir fried with prawns.",
        price: 5.50,
        img: "../img/charkwayteow.jpg"
      }
    ],

    "mak-cik-delights": [
      {
        name: "Nasi Lemak",
        description: "Coconut rice with sambal and egg.",
        price: 4.50,
        img: "../img/malay.jpg"
      },
      {
        name: "Beef Rendang",
        description: "Spicy slow cooked beef.",
        price: 6.00,
        img: "../img/sambal.jpg"
      }
    ],

    "little-india-express": [
      {
        name: "Chicken Biryani",
        description: "Fragrant basmati rice with chicken.",
        price: 6.50,
        img: "../img/indian.jpg"
      },
      {
        name: "Roti Prata",
        description: "Crispy prata served with curry.",
        price: 2.00,
        img: "../img/roti.jpg"
      }
    ],

    "tom-yum-house": [
      {
        name: "Tom Yum Soup",
        description: "Spicy and sour Thai soup.",
        price: 6.00,
        img: "../img/thai.jpg"
      },
      {
        name: "Pad Thai",
        description: "Stir fried Thai noodles.",
        price: 5.50,
        img: "../img/thai.jpg"
      }
    ],

    "western-bites": [
      {
        name: "Grilled Chicken Chop",
        description: "Juicy grilled chicken with fries.",
        price: 8.00,
        img: "../img/western.jpg"
      },
      {
        name: "Fish & Chips",
        description: "Crispy battered fish with fries.",
        price: 7.50,
        img: "../img/western.jpg"
      }
    ],

    "kopi-teh-corner": [
      {
        name: "Kopi O",
        description: "Traditional black coffee.",
        price: 1.50,
        img: "../img/drink.jpg"
      },
      {
        name: "Teh Tarik",
        description: "Pulled milk tea.",
        price: 1.80,
        img: "../img/drink.jpg"
      }
    ]

  };

  let menuItems = [];

  // If a specific stall is selected
  if (stallId && STALL_MENUS[stallId]) {
    menuItems = STALL_MENUS[stallId];
  } 
  // Or show all items
  else {
    menuItems = Object.values(STALL_MENUS).flat();
  }

  function renderMenu(){
    menuList.innerHTML = "";

    menuItems.forEach(item => {

      const card = document.createElement("div");
      card.className = "menu-card";

      card.innerHTML = `
        <img src="${item.img}" class="menu-img" alt="${item.name}">
        <div class="menu-content">
          <div class="menu-item-title">${item.name}</div>
          <div class="menu-description">${item.description}</div>
          <div class="menu-price">$${item.price.toFixed(2)}</div>
          <button class="menu-btn">Add to Cart</button>
        </div>
      `;

      card.querySelector(".menu-btn").addEventListener("click", function(){
        // Get existing cart or create new
        let store = JSON.parse(localStorage.getItem("store")) || { cart: [], order: null };

        // Check if item already in cart
        const existingItem = store.cart.find(i => i.name === item.name);
        if(existingItem){
          existingItem.qty += 1;
        } else {
          store.cart.push({...item, qty: 1}); 
        }

        localStorage.setItem("store", JSON.stringify(store));

        // Go to Checkout
        window.location.href = "Checkout.html";
      });

      menuList.appendChild(card);
    });
  }

  renderMenu();

})();