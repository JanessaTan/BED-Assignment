(function() {
  'use strict';
  // Define promotions and store them
  window.PROMOTIONS = [
    {
      id: "Promo_1",
      title: "$2 Discount Lunch Set",
      description: "Get $2 off every lunch set purchased from Golden Wok.",
      stallName: "Golden Wok",
      type: "order",
      minSpend: 10,
      amount: 2
    },
    {
      id: "Promo_2",
      title: "Free Kueh Kueh with Lunch Saver Meal",
      description: "Get 10% off all items from Mak Cik Delights.",
      stallName: "Mak Cik Delights",
      type: "stall",
      stallId: "mak-cik-delights",
      percent: 10
    },
    {
      id: "Promo_3",
      title: "Thosai Tuesday",
      description: "Enjoy $2 discount off Roti Prata every Tuesday.",
      stallName: "Little India Express",
      type: "daySpecific",
      stallId: "little-india-express",
      itemId: "rotiprata",
      allowedDay: 2,
      amount: 2
    },
    {
      id: "Promo_4",
      title: "Free Thai Milk Tea with Signature Set",
      description: "Buy Tom Yum Soup and get $3 off your order.",
      stallName: "Tom Yum House",
      type: "bundle",
      stallId: "tom-yum-house",
      itemId: "tomyumsoup",
      thresholdQty: 1,
      amount: 3
    },
    {
      id: "Promo_5",
      title: "Happy Hour",
      description: "From 12pm-3pm, enjoy 50% off all drinks.",
      stallName: "Kopi & Teh Corner",
      type: "timeSpecific",
      stallId: "kopi-teh-corner",
      startHour: 12,
      endHour: 15,
      percent: 50
    },
    {
      id: "promo6",
      title: "Spend $20, Get $5 Off",
      description: "Spend at least $20 on your order and get $5 off total.",
      stallName: "All Stalls",
      type: "order",
      minSpend: 20,
      amount: 5
    },
    {
      id: "promo7",
      title: "Western Special: 15% Off",
      description: "Get 15% off all items from Western Bites.",
      stallName: "Western Bites",
      type: "stall",
      stallId: "western-bites",
      percent: 15
    },
    {
      id: "promo8",
      title: "Buy 2 Fried Rice, Get $3 Off",
      description: "Get $3 off when you buy 2 Egg Fried Rice from Golden Wok.",
      stallName: "Golden Wok",
      type: "bundle",
      stallId: "golden-wok",
      itemId: "eggfriedrice",
      thresholdQty: 2,
      amount: 3
    },
    {
      id: "promo9",
      title: "Nasi Lemak Lover's Deal",
      description: "Buy 2 Nasi Lemak and save $2.",
      stallName: "Mak Cik Delights",
      type: "bundle",
      stallId: "mak-cik-delights",
      itemId: "nasilemak",
      thresholdQty: 2,
      amount: 2
    },
    {
      id: "promo10",
      title: "Indian Feast Discount",
      description: "Get 12% off all orders from Little India Express.",
      stallName: "Little India Express",
      type: "stall",
      stallId: "little-india-express",
      percent: 12
    },
    {
      id: "promo11",
      title: "Char Kway Teow Special",
      description: "Buy Char Kway Teow and get $1.50 off.",
      stallName: "Golden Wok",
      type: "bundle",
      stallId: "golden-wok",
      itemId: "charkwayteow",
      thresholdQty: 1,
      amount: 1.5
    },
    {
      id: "promo12",
      title: "Thai Combo Savings",
      description: "Buy both Tom Yum Soup and Pad Thai for $2 off.",
      stallName: "Tom Yum House",
      type: "bundle",
      stallId: "tom-yum-house",
      itemId: "padthai",
      thresholdQty: 1,
      amount: 2
    }
  ];

  // Storage keys
  window.KEYS = {
    selectedPromo: "selectedPromo",
    store: "store"
  };

  // Format currency
  window.fmt = function(amount) {
    return "$" + Number(amount || 0).toFixed(2);
  };

  // Create a div to get out of the HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Get from storage
  function getStoreObject() {
    try {
      const raw = localStorage.getItem(KEYS.store);
      return raw ? JSON.parse(raw) : { cart: [], order: { type: 'now' }, selectedPromo: null };
    } catch (e) {
      console.error('Error parsing store:', e);
      return { cart: [], order: { type: 'now' }, selectedPromo: null };
    }
  }

  // Save to storage
  function saveStoreObject(storeObj) {
    try {
      localStorage.setItem(KEYS.store, JSON.stringify(storeObj));
    } catch (e) {
      console.error('Error saving store:', e);
    }
  }

  // Select promotion then save to storage
  window.pickPromo = function(id) {
    const storeObj = getStoreObject();
    storeObj.selectedPromo = { id: id };
    saveStoreObject(storeObj);
    
    // Save to separate key to make it more compatible
    localStorage.setItem(KEYS.selectedPromo, JSON.stringify({ id: id }));
  };

  // Get currently selected promotion
  window.getPickedPromo = function() {
    // Try store object
    const storeObj = getStoreObject();
    if (storeObj.selectedPromo && storeObj.selectedPromo.id) {
      return storeObj.selectedPromo;
    }
    
    // Try separate key
    try {
      const raw = localStorage.getItem(KEYS.selectedPromo);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error('Error getting picked promo:', e);
    }
    
    return null;
  };

  // Clear selected promotion
  window.clearPromo = function() {
    const storeObj = getStoreObject();
    storeObj.selectedPromo = null;
    saveStoreObject(storeObj);
    localStorage.removeItem(KEYS.selectedPromo);
  };

  // Discount calculation
  window.computeDiscount = function(cart, subtotal) {
    const picked = getPickedPromo();
    
    if (!picked || !picked.id) {
      return {
        discount: 0,
        applied: null,
        reason: "No promotion selected"
      };
    }

    // Find the promotion
    const promo = PROMOTIONS.find(p => p.id === picked.id);
    
    if (!promo) {
      return {
        discount: 0,
        applied: null,
        reason: "Invalid promotion"
      };
    }

    // Calculate discount based on promotion type
    let discount = 0;
    let reason = "";
    let isEligible = false;

    switch (promo.type) {
      case "order":
        const result = calculateOrderDiscount(promo, cart, subtotal);
        discount = result.discount;
        reason = result.reason;
        isEligible = result.isEligible;
        break;

      case "stall":
        const stallResult = calculateStallDiscount(promo, cart, subtotal);
        discount = stallResult.discount;
        reason = stallResult.reason;
        isEligible = stallResult.isEligible;
        break;

      case "bundle":
        const bundleResult = calculateBundleDiscount(promo, cart, subtotal);
        discount = bundleResult.discount;
        reason = bundleResult.reason;
        isEligible = bundleResult.isEligible;
        break;

      case "daySpecific":
        const dayResult = calculateDaySpecificDiscount(promo, cart, subtotal);
        discount = dayResult.discount;
        reason = dayResult.reason;
        isEligible = dayResult.isEligible;
        break;

      case "timeSpecific":
        const timeResult = calculateTimeSpecificDiscount(promo, cart, subtotal);
        discount = timeResult.discount;
        reason = timeResult.reason;
        isEligible = timeResult.isEligible;
        break;

      default:
        reason = "Unknown promotion type";
    }

    if (discount > subtotal) {
      discount = subtotal;
    }

    return {
      discount: discount,
      applied: isEligible ? promo : null,
      reason: reason
    };
  };

  // Calculate minimum spend needed for order-wide discount (doesn't work if order doens't meet minSpend)
  function calculateOrderDiscount(promo, cart, subtotal) {
    const minSpend = promo.minSpend || 0;
    
    if (subtotal >= minSpend) {
      return {
        discount: promo.amount || 0,
        isEligible: true,
        reason: `Applied: ${promo.title}`
      };
    } else {
      const needed = minSpend - subtotal;
      return {
        discount: 0,
        isEligible: false,
        reason: `Add ${fmt(needed)} more to reach minimum spend of ${fmt(minSpend)}`
      };
    }
  }

  // Calculate stall-specific % discount
  function calculateStallDiscount(promo, cart, subtotal) {
    let stallTotal = 0;
    
    // Sum up items from the target stall
    cart.forEach(item => {
      const itemStallId = getStallIdFromItem(item);
      const promoStallId = normalizeStallId(promo.stallId);
      
      if (itemStallId === promoStallId) {
        stallTotal += (Number(item.price) || 0) * (Number(item.qty) || 0);
      }
    });

    if (stallTotal > 0) {
      const discount = stallTotal * ((promo.percent || 0) / 100);
      return {
        discount: discount,
        isEligible: true,
        reason: `Applied: ${promo.title} (${promo.percent}% off ${fmt(stallTotal)})`
      };
    } else {
      return {
        discount: 0,
        isEligible: false,
        reason: `Add items from ${promo.stallName || promo.stallId} to apply this promotion`
      };
    }
  }

  // Calculate bundle discount (buy X no. of item Y)
  function calculateBundleDiscount(promo, cart, subtotal) {
    let totalQty = 0;
    
    // Counted items
    cart.forEach(item => {
      const itemStallId = getStallIdFromItem(item);
      const promoStallId = normalizeStallId(promo.stallId);
      
      // Check if stall matches and item matches
      if (itemStallId === promoStallId && itemMatches(item, promo.itemId, promo.stallId)) {
        totalQty += Number(item.qty) || 0;
      }
    });

    const threshold = promo.thresholdQty || 1;
    
    if (totalQty >= threshold) {
      return {
        discount: promo.amount || 0,
        isEligible: true,
        reason: `Applied: ${promo.title}`
      };
    } else {
      const needed = threshold - totalQty;
      return {
        discount: 0,
        isEligible: false,
        reason: `Add ${needed} more qualifying item(s) to apply this promotion`
      };
    }
  }

  // Calculate discounts active on specific days
  function calculateDaySpecificDiscount(promo, cart, subtotal) {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
    const allowedDay = promo.allowedDay;
    
    if (today !== allowedDay) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        discount: 0,
        isEligible: false,
        reason: `This promotion is only valid on ${dayNames[allowedDay]}`
      };
    }

    // Check if cart has eligible items
    let hasItem = false;
    cart.forEach(item => {
      const itemStallId = getStallIdFromItem(item);
      const promoStallId = normalizeStallId(promo.stallId);
      
      if (itemStallId === promoStallId && itemMatches(item, promo.itemId, promo.stallId)) {
        hasItem = true;
      }
    });

    if (hasItem) {
      return {
        discount: promo.amount || 0,
        isEligible: true,
        reason: `Applied: ${promo.title}`
      };
    } else {
      return {
        discount: 0,
        isEligible: false,
        reason: `Add qualifying items from ${promo.stallName || promo.stallId} to apply`
      };
    }
  }

  // Calculate time-specific discount
  function calculateTimeSpecificDiscount(promo, cart, subtotal) {
    const now = new Date();
    const currentHour = now.getHours();
    
    const startHour = promo.startHour || 0;
    const endHour = promo.endHour || 24;
    
    if (currentHour < startHour || currentHour >= endHour) {
      return {
        discount: 0,
        isEligible: false,
        reason: `This promotion is only valid from ${startHour}:00 to ${endHour}:00`
      };
    }

    // Calculate discount on stall items
    let stallTotal = 0;
    cart.forEach(item => {
      const itemStallId = getStallIdFromItem(item);
      const promoStallId = normalizeStallId(promo.stallId);
      
      if (itemStallId === promoStallId) {
        stallTotal += (Number(item.price) || 0) * (Number(item.qty) || 0);
      }
    });

    if (stallTotal > 0) {
      const discount = stallTotal * ((promo.percent || 0) / 100);
      return {
        discount: discount,
        isEligible: true,
        reason: `Applied: ${promo.title} (${promo.percent}% off)`
      };
    } else {
      return {
        discount: 0,
        isEligible: false,
        reason: `Add items from ${promo.stallName || promo.stallId} during happy hour`
      };
    }
  }

  // Give stall IDs consistent format for comparison
  function normalizeStallId(id) {
    return String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Format item ID for comparison
  function normalizeItemId(id) {
    return String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Match item names to IDs
  const ITEM_NAME_MAP = {
    'eggfriedrice': 'egg fried rice',
    'charkwayteow': 'char kway teow',
    'nasilemak': 'nasi lemak',
    'beefrendang': 'beef rendang',
    'chickenbiryani': 'chicken biryani',
    'rotiprata': 'roti prata',
    'tomyumsoup': 'tom yum soup',
    'padthai': 'pad thai',
    'grilledchickenchop': 'grilled chicken chop',
    'fishandchips': 'fish & chips',
    'fish&chips': 'fish & chips',
    'kopio': 'kopi o',
    'tehtarik': 'teh tarik'
  };

  // Check if cart item matches promo item
  function itemMatches(cartItem, promoItemId, promoStallId) {
    // Normalize cart item name
    const cartItemName = normalizeItemId(cartItem.name || cartItem.itemId || '');
    const normalizedPromoItemId = normalizeItemId(promoItemId);
    
    // Direct ID match
    if (cartItemName === normalizedPromoItemId) {
      return true;
    }
    
    // Check name matching
    const mappedName = ITEM_NAME_MAP[normalizedPromoItemId];
    if (mappedName && normalizeItemId(mappedName) === cartItemName) {
      return true;
    }
    
    // Reverse match check
    const reverseMappedName = ITEM_NAME_MAP[cartItemName];
    if (reverseMappedName && normalizeItemId(reverseMappedName) === normalizedPromoItemId) {
      return true;
    }
    
    return false;
  }

  // Get stall ID from cart item
  function getStallIdFromItem(item) {
    // If item already has stallId
    if (item.stallId) {
      return normalizeStallId(item.stallId);
    }
    
    // Infer from item name
    const itemName = normalizeItemId(item.name || '');
    
    // Golden Wok items
    if (itemName === normalizeItemId('Egg Fried Rice') || 
        itemName === normalizeItemId('Char Kway Teow')) {
      return 'goldenwok';
    }
    
    // Mak Cik Delights items
    if (itemName === normalizeItemId('Nasi Lemak') || 
        itemName === normalizeItemId('Beef Rendang')) {
      return 'makcikdelights';
    }
    
    // Little India Express items
    if (itemName === normalizeItemId('Chicken Biryani') || 
        itemName === normalizeItemId('Roti Prata')) {
      return 'littleindiaexpress';
    }
    
    // Tom Yum House items
    if (itemName === normalizeItemId('Tom Yum Soup') || 
        itemName === normalizeItemId('Pad Thai')) {
      return 'tomyumhouse';
    }
    
    // Western Bites items
    if (itemName === normalizeItemId('Grilled Chicken Chop') || 
        itemName === normalizeItemId('Fish & Chips')) {
      return 'westernbites';
    }
    
    // Kopi & Teh Corner items
    if (itemName === normalizeItemId('Kopi O') || 
        itemName === normalizeItemId('Teh Tarik')) {
      return 'kopitehcorner';
    }
    
    return '';
  }

  // render promo list on HTML
  function renderPromotionList() {
    const promoList = document.getElementById('promoList');
    if (!promoList) return;

    const picked = getPickedPromo();
    const selectedId = picked ? picked.id : null;

    let html = '<div class="promo-grid">';

    PROMOTIONS.forEach(promo => {
      const isSelected = selectedId === promo.id;
      const stallLabel = promo.stallName || promo.stallId || 'All Stalls';
      
      html += `
        <a href="auto-promo.html" 
           class="promo-card ${isSelected ? 'selected' : ''}" 
           data-id="${escapeHtml(promo.id)}"
           onclick="window.pickPromo('${escapeHtml(promo.id)}'); return true;">
          
          <div class="promo-stall">${escapeHtml(stallLabel)}</div>
          
          <h3 class="promo-title">
            ${escapeHtml(promo.title)}
          </h3>
          
          <p class="promo-desc">
            ${escapeHtml(promo.description)}
          </p>
          
          ${isSelected ? '<div class="promo-selected-badge">✓ Selected</div>' : ''}
        </a>
      `;
    });

    html += '</div>';
    promoList.innerHTML = html;
  }

  // Some styles for the promo cards
  function injectPromotionStyles() {
    if (document.getElementById('promo-dynamic-styles')) return;

    const style = document.createElement('style');
    style.id = 'promo-dynamic-styles';
    style.textContent = `
      .promo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .promo-card {
        position: relative;
        display: block;
        background: #fff;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .promo-card:hover {
        border-color: #ff9800;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
        transform: translateY(-2px);
      }

      .promo-card.selected {
        border-color: #ff9800;
        background: #fff7ed;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      }

      .promo-stall {
        font-size: 0.85rem;
        color: #666;
        font-weight: 500;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .promo-title {
        font-size: 1.2rem;
        font-weight: 700;
        margin: 8px 0;
        color: #333;
      }

      .promo-desc {
        font-size: 0.95rem;
        color: #555;
        line-height: 1.5;
        margin: 8px 0 0 0;
      }

      .promo-selected-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #4caf50;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .promo-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Start on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Render promotion list if on Promotion.html
    if (document.getElementById('promoList')) {
      injectPromotionStyles();
      renderPromotionList();
    }
  });

})();