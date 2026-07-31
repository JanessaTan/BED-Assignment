(function createHawkerHub(global) {
  "use strict";

  const KEYS = {
    users: "hc.users",
    currentUser: "hc.currentUser",
    role: "hc.role",
    selectedCentre: "hc.selectedCentre",
    selectedStall: "hc.selectedStall",
    cart: "hc.cart",
    orders: "hc.orders",
    feedback: "hc.feedback",
    complaints: "hc.complaints",
    likes: "hc.likes",
    promotions: "hc.promotions",
    crowdLevels: "hc.crowdLevels",
    menuItems: "hc.menuItems",
    ratings: "hc.ratings",
    inspections: "hc.inspections",
    rentalAgreements: "hc.rentalAgreements",
    stallOperations: "hc.stallOperations"
  };

  const CENTRES = [
    {
      id: "clementi-centre-01",
      name: "Clementi 448 Market & Food Centre",
      town: "Clementi",
      address: "448 Clementi Avenue 3, Singapore 120448",
      mrt: "Clementi MRT",
      hours: "6:00 AM - 10:00 PM",
      description: "A neighbourhood favourite for breakfast classics and hearty local meals.",
      crowdBase: 54
    },
    {
      id: "bedok-centre-01",
      name: "Bedok Interchange Hawker Centre",
      town: "Bedok",
      address: "208B New Upper Changi Road, Singapore 462208",
      mrt: "Bedok MRT",
      hours: "6:30 AM - 11:00 PM",
      description: "Conveniently located beside the interchange with a broad mix of cuisines.",
      crowdBase: 62
    },
    {
      id: "tampines-centre-01",
      name: "Our Tampines Hub Hawker Centre",
      town: "Tampines",
      address: "1 Tampines Walk, Singapore 528523",
      mrt: "Tampines MRT",
      hours: "7:00 AM - 10:00 PM",
      description: "A family-friendly food destination inside the vibrant community hub.",
      crowdBase: 58
    },
    {
      id: "jurong-centre-01",
      name: "Yuhua Village Market & Food Centre",
      town: "Jurong East",
      address: "254 Jurong East Street 24, Singapore 600254",
      mrt: "Chinese Garden MRT",
      hours: "6:00 AM - 9:30 PM",
      description: "A welcoming heartland centre known for affordable comfort food.",
      crowdBase: 45
    },
    {
      id: "toa-payoh-centre-01",
      name: "Toa Payoh Lorong 8 Market & Food Centre",
      town: "Toa Payoh",
      address: "210 Lorong 8 Toa Payoh, Singapore 310210",
      mrt: "Braddell MRT",
      hours: "6:00 AM - 9:00 PM",
      description: "A relaxed community market with long-running family stalls.",
      crowdBase: 47
    },
    {
      id: "chinatown-centre-01",
      name: "Chinatown Complex Food Centre",
      town: "Chinatown",
      address: "335 Smith Street, Singapore 050335",
      mrt: "Chinatown MRT",
      hours: "7:00 AM - 10:00 PM",
      description: "A large heritage food centre showcasing Singapore's diverse hawker culture.",
      crowdBase: 67
    }
  ];

  const STALLS = [
    {
      id: "clementi-chicken-rice",
      centreId: "clementi-centre-01",
      name: "Clementi Golden Chicken Rice",
      cuisine: "Chinese",
      description: "Poached chicken, fragrant rice and house-made chilli.",
      hours: "9:00 AM - 8:30 PM",
      rating: 4.7,
      popularity: 96,
      hygiene: "A",
      crowd: 72,
      promotionId: "promo-chicken"
    },
    {
      id: "clementi-kopi",
      centreId: "clementi-centre-01",
      name: "Sunrise Kopi & Toast",
      cuisine: "Beverages",
      description: "Traditional kopi, tea and crisp kaya toast sets.",
      hours: "6:30 AM - 5:00 PM",
      rating: 4.4,
      popularity: 84,
      hygiene: "A",
      crowd: 48,
      promotionId: "promo-kopi"
    },
    {
      id: "bedok-laksa",
      centreId: "bedok-centre-01",
      name: "Bedok Heritage Laksa",
      cuisine: "Peranakan",
      description: "Rich coconut gravy, rice noodles and fresh cockles.",
      hours: "10:30 AM - 9:00 PM",
      rating: 4.6,
      popularity: 93,
      hygiene: "B",
      crowd: 69,
      promotionId: "promo-laksa"
    },
    {
      id: "bedok-veg",
      centreId: "bedok-centre-01",
      name: "Green Wok Vegetarian",
      cuisine: "Vegetarian",
      description: "Colourful meat-free rice and noodle dishes.",
      hours: "9:00 AM - 8:00 PM",
      rating: 4.2,
      popularity: 72,
      hygiene: "A",
      crowd: 41,
      promotionId: null
    },
    {
      id: "tampines-nasi",
      centreId: "tampines-centre-01",
      name: "Mak Cik Nasi Lemak",
      cuisine: "Malay",
      description: "Coconut rice with sambal and freshly cooked sides.",
      hours: "7:00 AM - 9:00 PM",
      rating: 4.8,
      popularity: 98,
      hygiene: "A",
      crowd: 77,
      promotionId: "promo-nasi"
    },
    {
      id: "jurong-prata",
      centreId: "jurong-centre-01",
      name: "Prata Junction",
      cuisine: "Indian",
      description: "Crisp prata and aromatic curries made throughout the day.",
      hours: "7:00 AM - 10:00 PM",
      rating: 4.3,
      popularity: 80,
      hygiene: "B",
      crowd: 51,
      promotionId: null
    },
    {
      id: "toa-payoh-fish",
      centreId: "toa-payoh-centre-01",
      name: "Ah Seng Fish Soup",
      cuisine: "Chinese",
      description: "Clear, comforting fish soup with sliced fish and vegetables.",
      hours: "10:00 AM - 8:00 PM",
      rating: 4.5,
      popularity: 88,
      hygiene: "A",
      crowd: 57,
      promotionId: null
    },
    {
      id: "chinatown-dessert",
      centreId: "chinatown-centre-01",
      name: "Old Street Desserts",
      cuisine: "Desserts",
      description: "Traditional hot and cold desserts with reduced-sugar options.",
      hours: "11:00 AM - 9:30 PM",
      rating: 4.4,
      popularity: 86,
      hygiene: "C",
      crowd: 64,
      promotionId: "promo-dessert"
    }
  ];

  const MENU_ITEMS = [
    {
      id: "menu-chicken-rice",
      stallId: "clementi-chicken-rice",
      name: "Signature Chicken Rice",
      category: "Main",
      description: "Tender poached chicken with fragrant rice, cucumber and chilli.",
      price: 4.5,
      cuisines: ["Chinese", "Singaporean"],
      available: true,
      prep: 8,
      likes: 128,
      addOns: [
        { name: "Extra rice", price: 0.7 },
        { name: "Extra chicken", price: 2.0 }
      ]
    },
    {
      id: "menu-roast-chicken",
      stallId: "clementi-chicken-rice",
      name: "Roasted Chicken Rice",
      category: "Main",
      description: "Caramelised roasted chicken served with fragrant rice.",
      price: 5.0,
      cuisines: ["Chinese"],
      available: true,
      prep: 10,
      likes: 89,
      addOns: [{ name: "Braised egg", price: 0.8 }]
    },
    {
      id: "menu-chicken-soup",
      stallId: "clementi-chicken-rice",
      name: "Chicken Dumpling Soup",
      category: "Side",
      description: "Light broth with handmade chicken dumplings.",
      price: 3.2,
      cuisines: ["Chinese"],
      available: false,
      prep: 7,
      likes: 34,
      addOns: []
    },
    {
      id: "menu-kaya-set",
      stallId: "clementi-kopi",
      name: "Kaya Toast Set",
      category: "Set",
      description: "Crisp kaya toast, two soft-boiled eggs and a hot drink.",
      price: 3.8,
      cuisines: ["Singaporean"],
      available: true,
      prep: 6,
      likes: 96,
      addOns: [{ name: "Upgrade to iced drink", price: 0.5 }]
    },
    {
      id: "menu-iced-milo",
      stallId: "clementi-kopi",
      name: "Iced Milo",
      category: "Drink",
      description: "Cold chocolate malt drink over ice.",
      price: 2.2,
      cuisines: ["Beverages"],
      available: true,
      prep: 3,
      likes: 58,
      addOns: [{ name: "Milo dinosaur topping", price: 0.7 }]
    },
    {
      id: "menu-laksa",
      stallId: "bedok-laksa",
      name: "Heritage Laksa",
      category: "Main",
      description: "Rice noodles in spiced coconut broth with fish cake and prawns.",
      price: 5.5,
      cuisines: ["Peranakan", "Singaporean"],
      available: true,
      prep: 9,
      likes: 146,
      addOns: [{ name: "Extra cockles", price: 1.2 }]
    },
    {
      id: "menu-veg-rice",
      stallId: "bedok-veg",
      name: "Rainbow Veg Rice",
      category: "Main",
      description: "Brown rice with tofu and seasonal vegetables.",
      price: 5.2,
      cuisines: ["Vegetarian", "Asian"],
      available: true,
      prep: 8,
      likes: 41,
      addOns: [{ name: "Extra tofu", price: 1.0 }]
    },
    {
      id: "menu-nasi-lemak",
      stallId: "tampines-nasi",
      name: "Classic Nasi Lemak",
      category: "Main",
      description: "Coconut rice, fried chicken wing, egg, ikan bilis and sambal.",
      price: 5.8,
      cuisines: ["Malay", "Singaporean"],
      available: true,
      prep: 10,
      likes: 178,
      addOns: [{ name: "Extra sambal", price: 0.3 }]
    },
    {
      id: "menu-prata",
      stallId: "jurong-prata",
      name: "Roti Prata",
      category: "Main",
      description: "Two plain prata with fish curry.",
      price: 2.8,
      cuisines: ["Indian"],
      available: true,
      prep: 7,
      likes: 101,
      addOns: [{ name: "Add cheese", price: 1.0 }]
    },
    {
      id: "menu-fish-soup",
      stallId: "toa-payoh-fish",
      name: "Sliced Fish Soup",
      category: "Main",
      description: "Fresh fish slices, vegetables and tofu in clear broth.",
      price: 6.0,
      cuisines: ["Chinese"],
      available: true,
      prep: 11,
      likes: 84,
      addOns: [{ name: "Add milk", price: 0.5 }]
    },
    {
      id: "menu-chendol",
      stallId: "chinatown-dessert",
      name: "Gula Melaka Chendol",
      category: "Dessert",
      description: "Shaved ice with coconut milk, chendol and gula melaka.",
      price: 3.5,
      cuisines: ["Desserts", "Singaporean"],
      available: true,
      prep: 4,
      likes: 114,
      addOns: [{ name: "Extra red beans", price: 0.6 }]
    }
  ];

  const PROMOTIONS = [
    {
      id: "promo-chicken",
      centreId: "clementi-centre-01",
      stallId: "clementi-chicken-rice",
      title: "Weekday Chicken Rice Treat",
      description: "$1 off one Signature Chicken Rice.",
      discount: 1,
      start: "2026-01-01",
      end: "2027-12-31",
      eligibleItemIds: ["menu-chicken-rice"]
    },
    {
      id: "promo-kopi",
      centreId: "clementi-centre-01",
      stallId: "clementi-kopi",
      title: "Morning Kopi Pair",
      description: "Save $0.50 on a Kaya Toast Set.",
      discount: 0.5,
      start: "2026-01-01",
      end: "2027-12-31",
      eligibleItemIds: ["menu-kaya-set"]
    },
    {
      id: "promo-laksa",
      centreId: "bedok-centre-01",
      stallId: "bedok-laksa",
      title: "Laksa Lunch Special",
      description: "10% demo discount on Heritage Laksa.",
      discount: 0.55,
      start: "2026-01-01",
      end: "2027-12-31",
      eligibleItemIds: ["menu-laksa"]
    },
    {
      id: "promo-nasi",
      centreId: "tampines-centre-01",
      stallId: "tampines-nasi",
      title: "Nasi Lemak Bundle",
      description: "$0.80 off the Classic Nasi Lemak.",
      discount: 0.8,
      start: "2026-01-01",
      end: "2027-12-31",
      eligibleItemIds: ["menu-nasi-lemak"]
    },
    {
      id: "promo-dessert",
      centreId: "chinatown-centre-01",
      stallId: "chinatown-dessert",
      title: "Dessert Happy Hour",
      description: "$0.50 off chendol after 3 PM.",
      discount: 0.5,
      start: "2025-01-01",
      end: "2025-12-31",
      eligibleItemIds: ["menu-chendol"]
    }
  ];

  const HYGIENE_RECORDS = [
    { stallId: "clementi-chicken-rice", grade: "A", date: "2026-05-10", score: 94, remarks: "Excellent food handling and clean preparation areas.", validUntil: "2027-05-09" },
    { stallId: "clementi-chicken-rice", grade: "B", date: "2025-05-04", score: 84, remarks: "Good overall; improve dry-storage labelling.", validUntil: "2026-05-03" },
    { stallId: "clementi-kopi", grade: "A", date: "2026-04-18", score: 92, remarks: "Clean beverage station and safe ingredient storage.", validUntil: "2027-04-17" },
    { stallId: "bedok-laksa", grade: "B", date: "2026-03-22", score: 85, remarks: "Good practices with minor drainage improvements required.", validUntil: "2027-03-21" },
    { stallId: "bedok-veg", grade: "A", date: "2026-02-16", score: 91, remarks: "Strong separation of raw and cooked ingredients.", validUntil: "2027-02-15" },
    { stallId: "tampines-nasi", grade: "A", date: "2026-06-01", score: 95, remarks: "Excellent temperature control and workstation hygiene.", validUntil: "2027-05-31" },
    { stallId: "jurong-prata", grade: "B", date: "2026-01-12", score: 82, remarks: "Generally good; cleaning log should be updated more often.", validUntil: "2027-01-11" },
    { stallId: "toa-payoh-fish", grade: "A", date: "2026-05-24", score: 93, remarks: "Fresh-food handling and cold storage were excellent.", validUntil: "2027-05-23" },
    { stallId: "chinatown-dessert", grade: "C", date: "2026-04-03", score: 72, remarks: "Corrective action requested for utensil storage and cleaning frequency.", validUntil: "2027-04-02" }
  ];

  const SAMPLE_REVIEWS = [
    { id: "review-1", stallId: "clementi-chicken-rice", user: "Alicia", rating: 5, food: 5, service: 4, comment: "Tender chicken and quick service during lunch.", date: "2026-07-16" },
    { id: "review-2", stallId: "clementi-chicken-rice", user: "Marcus", rating: 4, food: 4, service: 4, comment: "Good value and the chilli has a nice kick.", date: "2026-07-10" },
    { id: "review-3", stallId: "bedok-laksa", user: "Nur", rating: 5, food: 5, service: 5, comment: "Rich gravy without being too heavy.", date: "2026-06-28" },
    { id: "review-4", stallId: "tampines-nasi", user: "Devi", rating: 5, food: 5, service: 4, comment: "Crispy chicken wing and fragrant rice.", date: "2026-06-20" }
  ];

  const CUSTOMER_NAV = [
    ["home", "Home", "home.html"],
    ["browse", "Browse Hawker Centres", "browse-hawker-centres.html"],
    ["crowd", "Crowd Level", "crowd-level.html"],
    ["promotion", "Promotions", "promotion.html"],
    ["cart", "Cart", "cart.html"],
    ["history", "Order History", "order-history.html"],
    ["feedback", "Feedback", "feedback.html"]
  ];

  const VENDOR_NAV = [
    ["dashboard", "Vendor Dashboard", "vendor-dashboard.html"],
    ["menu-management", "Menu Management", "menu-management.html"],
    ["orders", "Orders", "order.html"],
    ["promotion", "Promotions", "promotion.html"],
    ["rental", "Rental Agreement", "rental-agreement.html"],
    ["analytics", "Sales Analytics", "sales-analytics.html"]
  ];

  const NEA_NAV = [
    ["nea-dashboard", "NEA Dashboard", "nea-dashboard.html"],
    ["inspections", "Inspections & Grades", "nea-inspections.html"]
  ];

  const OPERATOR_NAV = [
    ["operator-dashboard", "Operator Dashboard", "operator-dashboard.html"],
    ["centre-operations", "Centre Operations", "centre-operations.html"],
    ["rental-management", "Rental Management", "rental-management.html"],
    ["complaint-management", "Complaints", "complaint-management.html"]
  ];

  function loadData(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue === null ? fallback : JSON.parse(rawValue);
    } catch (error) {
      console.warn("Could not read local demo data.", error);
      return fallback;
    }
  }

  function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function ensureSeedData() {
    const demoUsers = [
      { id: "user-customer-demo", name: "Demo Customer", email: "customer@demo.sg", password: "Customer123", role: "customer" },
      { id: "user-vendor-demo", name: "Demo Vendor", email: "vendor@demo.sg", password: "Vendor123", role: "vendor", stallId: "clementi-chicken-rice" },
      { id: "user-nea-demo", name: "Demo NEA Officer", email: "nea@demo.sg", password: "NEAOfficer123", role: "nea_officer" },
      { id: "user-operator-demo", name: "Demo Centre Operator", email: "operator@demo.sg", password: "Operator123", role: "operator", centreId: "clementi-centre-01" }
    ];
    const users = loadData(KEYS.users, []);
    demoUsers.forEach((demoUser) => {
      if (!users.some((user) => user.id === demoUser.id)) users.push(demoUser);
    });
    saveData(KEYS.users, users);
    if (!localStorage.getItem(KEYS.menuItems)) saveData(KEYS.menuItems, MENU_ITEMS);
    if (!localStorage.getItem(KEYS.promotions)) saveData(KEYS.promotions, PROMOTIONS);
    if (!localStorage.getItem(KEYS.cart)) saveData(KEYS.cart, []);
    if (!localStorage.getItem(KEYS.orders)) saveData(KEYS.orders, createDemoOrders());
    if (!localStorage.getItem(KEYS.feedback)) saveData(KEYS.feedback, SAMPLE_REVIEWS);
    if (!localStorage.getItem(KEYS.ratings)) saveData(KEYS.ratings, SAMPLE_REVIEWS);
    if (!localStorage.getItem(KEYS.complaints)) saveData(KEYS.complaints, [
      { id: "CMP-26070101", stallId: "clementi-kopi", category: "Service issue", description: "The queue information was unclear during the morning peak period.", reference: "", userId: "user-customer-demo", status: "Submitted", createdAt: "2026-07-28T08:40:00+08:00" },
      { id: "CMP-26070102", stallId: "clementi-chicken-rice", category: "Hygiene concern", description: "The tray return area beside the stall needed attention during lunch.", reference: "HC-260715-1042", userId: "user-customer-demo", status: "Under Review", createdAt: "2026-07-29T13:10:00+08:00" }
    ]);
    if (!localStorage.getItem(KEYS.likes)) saveData(KEYS.likes, {});
    if (!localStorage.getItem(KEYS.inspections)) saveData(KEYS.inspections, [
      { id: "INS-S001", stallId: "clementi-kopi", status: "Scheduled", scheduledDate: "2026-08-12", date: "", score: null, grade: "", remarks: "", validUntil: "" },
      ...HYGIENE_RECORDS.map((record, index) => ({ ...record, id: `INS-${String(index + 1).padStart(4, "0")}`, status: "Completed", scheduledDate: record.date }))
    ]);
    if (!localStorage.getItem(KEYS.rentalAgreements)) saveData(KEYS.rentalAgreements, [
      { id: "RA-2025-018", stallId: "clementi-chicken-rice", centreId: "clementi-centre-01", unit: "#01-18", start: "2025-09-01", end: "2027-08-31", monthlyRent: 1850, status: "Active", terms: "Monthly rent is due by the seventh day. Vendor must comply with food-safety and centre operating requirements." },
      { id: "RA-2025-019", stallId: "clementi-kopi", centreId: "clementi-centre-01", unit: "#01-19", start: "2025-06-01", end: "2026-09-30", monthlyRent: 1520, status: "Renewal Due", terms: "Monthly rent is due by the seventh day. Renovation requires operator approval." }
    ]);
    if (!localStorage.getItem(KEYS.stallOperations)) saveData(KEYS.stallOperations, STALLS.map((stall) => ({ stallId: stall.id, operationalStatus: "Open", maintenanceNote: "", updatedAt: new Date().toISOString() })));
  }

  function getInspections(stallId) {
    const inspections = loadData(KEYS.inspections, []);
    return stallId ? inspections.filter((inspection) => inspection.stallId === stallId) : inspections;
  }

  function getCurrentHygieneRecord(stallId) {
    return getInspections(stallId)
      .filter((inspection) => inspection.status === "Completed" && inspection.grade)
      .sort((a, b) => new Date(b.date || b.scheduledDate) - new Date(a.date || a.scheduledDate))[0] || null;
  }

  function createDemoOrders() {
    return [
      {
        id: "HC-260715-1042",
        userId: "user-customer-demo",
        customerName: "Demo Customer",
        createdAt: "2026-07-15T12:20:00+08:00",
        status: "Completed",
        paymentStatus: "Successful",
        collectionMethod: "Self collection",
        paymentMethod: "PayNow",
        notes: "",
        packaging: "Standard",
        items: [
          { menuItemId: "menu-chicken-rice", stallId: "clementi-chicken-rice", name: "Signature Chicken Rice", price: 4.5, quantity: 2, addOns: [] }
        ],
        total: 9.3
      }
    ];
  }

  function getCurrentUser() {
    return loadData(KEYS.currentUser, null);
  }

  function setCurrentUser(user) {
    saveData(KEYS.currentUser, user);
    saveData(KEYS.role, user ? user.role : null);
  }

  function getRole() {
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.role : null;
  }

  function requireLogin() {
    if (!getCurrentUser()) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`login.html?next=${next}`);
      return false;
    }
    return true;
  }

  function requireRole(allowedRoles) {
    if (!requireLogin()) return false;
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const role = getRole();
    if (!allowed.includes(role)) {
      showToast("That page is not available for your account role.", "error");
      window.setTimeout(function redirectForRole() {
        const landingPages = {
          customer: "home.html",
          guest: "home.html",
          vendor: "vendor-dashboard.html",
          nea_officer: "nea-dashboard.html",
          operator: "operator-dashboard.html"
        };
        window.location.replace(landingPages[role] || "login.html");
      }, 250);
      return false;
    }
    return true;
  }

  function logout() {
    localStorage.removeItem(KEYS.currentUser);
    localStorage.removeItem(KEYS.role);
    window.location.replace("login.html");
  }

  function getQueryParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD"
    }).format(Number(value) || 0);
  }

  function formatDate(value, includeTime) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      ...(includeTime ? { timeStyle: "short" } : {})
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message, type) {
    let region = document.getElementById("toastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "toastRegion";
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(function removeToast() {
      toast.remove();
    }, 3600);
  }

  function getCentreById(id) {
    return CENTRES.find((centre) => centre.id === id) || null;
  }

  function getStallById(id) {
    return STALLS.find((stall) => stall.id === id) || null;
  }

  function getPromotionById(id) {
    return loadData(KEYS.promotions, PROMOTIONS).find((promotion) => promotion.id === id) || null;
  }

  function getMenuItems() {
    return loadData(KEYS.menuItems, MENU_ITEMS);
  }

  function getStallCount(centreId) {
    return STALLS.filter((stall) => stall.centreId === centreId).length;
  }

  function selectCentre(centreId) {
    saveData(KEYS.selectedCentre, centreId);
    window.location.href = `stalls.html?centre=${encodeURIComponent(centreId)}`;
  }

  function resolveSelectedCentre() {
    return getQueryParameter("centre") || loadData(KEYS.selectedCentre, null);
  }

  function selectStall(stallId) {
    saveData(KEYS.selectedStall, stallId);
    window.location.href = `menu-item.html?stall=${encodeURIComponent(stallId)}`;
  }

  function resolveSelectedStall() {
    return getQueryParameter("stall") || loadData(KEYS.selectedStall, null);
  }

  function crowdLabel(percentage) {
    if (percentage < 35) return "Low";
    if (percentage < 60) return "Moderate";
    if (percentage < 80) return "High";
    return "Very High";
  }

  function calculateCrowd(centre, refresh) {
    const saved = loadData(KEYS.crowdLevels, {});
    if (!refresh && saved[centre.id]) return saved[centre.id];

    const hour = new Date().getHours();
    let peakModifier = 0;
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 20)) peakModifier = 18;
    if (hour < 7 || hour > 21) peakModifier = -20;
    const variation = refresh ? Math.floor(Math.random() * 15) - 7 : 0;
    const percentage = Math.max(12, Math.min(96, centre.crowdBase + peakModifier + variation));
    const record = {
      percentage,
      label: crowdLabel(percentage),
      seats: Math.max(8, Math.round((100 - percentage) * 2.4)),
      updatedAt: new Date().toISOString()
    };
    saved[centre.id] = record;
    saveData(KEYS.crowdLevels, saved);
    return record;
  }

  function getCart() {
    return loadData(KEYS.cart, []);
  }

  function saveCart(cart) {
    saveData(KEYS.cart, cart);
    updateCartCount();
    return cart;
  }

  function addToCart(menuItem, quantity, selectedAddOns) {
    const itemQuantity = Math.max(1, Number(quantity) || 1);
    const addOns = selectedAddOns || [];
    const signature = addOns.map((addOn) => addOn.name).sort().join("|");
    const cart = getCart();
    const existing = cart.find((item) => item.menuItemId === menuItem.id && item.addOnSignature === signature);
    if (existing) {
      existing.quantity += itemQuantity;
    } else {
      cart.push({
        cartLineId: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        menuItemId: menuItem.id,
        stallId: menuItem.stallId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: itemQuantity,
        addOns,
        addOnSignature: signature
      });
    }
    saveCart(cart);
  }

  function calculateLineTotal(line) {
    const addOnTotal = (line.addOns || []).reduce((sum, addOn) => sum + Number(addOn.price), 0);
    const discount = Math.min(Number(line.promotionDiscount) || 0, Number(line.price));
    return (Number(line.price) + addOnTotal - discount) * Number(line.quantity);
  }

  function getCartSummary(cartInput) {
    const cart = cartInput || getCart();
    const itemSubtotal = cart.reduce((sum, line) => sum + calculateLineTotal(line), 0);
    const stallIds = [...new Set(cart.map((line) => line.stallId))];
    const packaging = cart.length ? stallIds.length * 0.3 : 0;
    return {
      itemSubtotal,
      packaging,
      total: itemSubtotal + packaging,
      itemCount: cart.reduce((sum, line) => sum + Number(line.quantity), 0)
    };
  }

  function updateCartCount() {
    const count = getCartSummary().itemCount;
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.setAttribute("aria-label", `${count} items in cart`);
    });
  }

  function createOrder(checkoutData) {
    const cart = getCart();
    const summary = getCartSummary(cart);
    const currentUser = getCurrentUser();
    const datePart = new Date().toISOString().slice(2, 10).replaceAll("-", "");
    const order = {
      id: `HC-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser ? currentUser.id : "guest",
      customerName: checkoutData.customerName,
      createdAt: new Date().toISOString(),
      status: "Order received",
      paymentStatus: checkoutData.paymentStatus || "Successful",
      collectionMethod: checkoutData.collectionMethod,
      paymentMethod: checkoutData.paymentMethod,
      notes: checkoutData.notes,
      packaging: checkoutData.packaging,
      items: cart,
      total: summary.total
    };
    const orders = loadData(KEYS.orders, []);
    orders.unshift(order);
    saveData(KEYS.orders, orders);
    saveCart([]);
    sessionStorage.setItem("hc.latestOrder", order.id);
    return order;
  }

  function getVisibleOrders() {
    const user = getCurrentUser();
    const orders = loadData(KEYS.orders, []);
    if (!user) return [];
    if (user.role === "vendor") {
      const stallId = user.stallId || "clementi-chicken-rice";
      return orders.filter((order) => order.items.some((item) => item.stallId === stallId));
    }
    return orders.filter((order) => order.userId === user.id || (user.role === "guest" && order.userId === "guest"));
  }

  function isPromotionActive(promotion) {
    const now = new Date();
    const start = new Date(`${promotion.start}T00:00:00`);
    const end = new Date(`${promotion.end}T23:59:59`);
    return now >= start && now <= end;
  }

  function hygieneText(grade) {
    const labels = {
      A: "Excellent",
      B: "Good",
      C: "Satisfactory",
      D: "Needs Improvement"
    };
    return `Grade ${grade} - ${labels[grade] || "Not rated"}`;
  }

  function hygieneBadgeClass(grade) {
    if (grade === "A") return "badge-success";
    if (grade === "B") return "badge-info";
    if (grade === "C") return "badge-warning";
    return "badge-danger";
  }

  function crowdBadgeClass(label) {
    if (label === "Low") return "badge-success";
    if (label === "Moderate") return "badge-info";
    if (label === "High") return "badge-warning";
    return "badge-danger";
  }

  function renderHeader(activePage, options) {
    const headerTarget = document.getElementById("siteHeader");
    if (!headerTarget) return;

    const user = getCurrentUser();
    const role = user ? user.role : null;
    let navItems = [];
    if (role === "vendor") navItems = VENDOR_NAV;
    if (role === "customer" || role === "guest") navItems = CUSTOMER_NAV;
    if (role === "nea_officer") navItems = NEA_NAV;
    if (role === "operator") navItems = OPERATOR_NAV;

    const navLinks = navItems.map(([key, label, href]) => {
      const cartBadge = key === "cart" ? '<span class="cart-count" data-cart-count>0</span>' : "";
      return `<a class="${key === "cart" ? "cart-link" : ""}" href="${href}" ${key === activePage ? 'aria-current="page"' : ""}>${label}${cartBadge}</a>`;
    }).join("");

    const accountControl = user
      ? `<button type="button" data-logout>Logout <span class="sr-only">${escapeHtml(user.name)}</span></button>`
      : '<a href="login.html">Login</a>';

    headerTarget.innerHTML = `
      <a class="skip-link" href="#mainContent">Skip to main content</a>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="${role === "vendor" ? "vendor-dashboard.html" : role === "nea_officer" ? "nea-dashboard.html" : role === "operator" ? "operator-dashboard.html" : "home.html"}" aria-label="HawkerHub home">
            <span class="brand-mark" aria-hidden="true">HH</span>
            <span>HawkerHub<small>Singapore hawker companion</small></span>
          </a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="siteNavigation">
            <span aria-hidden="true">☰</span><span class="sr-only">Open navigation</span>
          </button>
          <nav class="site-nav" id="siteNavigation" aria-label="Main navigation">
            ${navLinks}
            ${accountControl}
          </nav>
        </div>
      </header>`;

    const toggle = headerTarget.querySelector(".nav-toggle");
    const nav = headerTarget.querySelector(".site-nav");
    toggle.addEventListener("click", function toggleNavigation() {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    headerTarget.querySelector("[data-logout]")?.addEventListener("click", logout);
    updateCartCount();

    if (options && options.minimal) {
      nav.innerHTML = '<a href="credit.html">Credits</a>';
    }
  }

  function renderFooter() {
    const footerTarget = document.getElementById("siteFooter");
    if (!footerTarget) return;
    const year = new Date().getFullYear();
    const role = getRole();
    const quickLinks = role === "nea_officer"
      ? '<li><a href="nea-dashboard.html">NEA dashboard</a></li><li><a href="nea-inspections.html">Inspections & grades</a></li>'
      : role === "operator"
        ? '<li><a href="centre-operations.html">Centre operations</a></li><li><a href="rental-management.html">Rental management</a></li><li><a href="complaint-management.html">Complaint management</a></li>'
        : role === "vendor"
          ? '<li><a href="vendor-dashboard.html">Vendor dashboard</a></li><li><a href="menu-management.html">Menu management</a></li><li><a href="sales-analytics.html">Sales analytics</a></li>'
          : '<li><a href="browse-hawker-centres.html">Browse centres</a></li><li><a href="crowd-level.html">Check crowd levels</a></li><li><a href="promotion.html">View promotions</a></li>';
    footerTarget.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <section>
            <h2>HawkerHub</h2>
            <p>A student front-end demonstration for exploring Singapore hawker centres, ordering food and supporting vendors.</p>
          </section>
          <section>
            <h3>Quick links</h3>
            <ul>
              ${quickLinks}
            </ul>
          </section>
          <section>
            <h3>Project</h3>
            <ul>
              <li><a href="credit.html">Credits and data notice</a></li>
              <li><a href="../README.md">README</a></li>
            </ul>
          </section>
        </div>
        <div class="footer-bottom">&copy; ${year} HawkerHub. Educational front-end demonstration.</div>
      </footer>`;
  }

  function initPage(activePage, allowedRoles, options) {
    ensureSeedData();
    if (allowedRoles && !requireRole(allowedRoles)) return false;
    renderHeader(activePage, options);
    renderFooter();
    return true;
  }

  function resetDemoData() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    ensureSeedData();
  }

  global.HC = {
    KEYS,
    centres: CENTRES,
    stalls: STALLS,
    hygieneRecords: HYGIENE_RECORDS,
    loadData,
    saveData,
    ensureSeedData,
    getCurrentUser,
    setCurrentUser,
    getRole,
    requireLogin,
    requireRole,
    logout,
    getQueryParameter,
    formatCurrency,
    formatDate,
    escapeHtml,
    showToast,
    getCentreById,
    getStallById,
    getPromotionById,
    getMenuItems,
    getInspections,
    getCurrentHygieneRecord,
    getStallCount,
    selectCentre,
    resolveSelectedCentre,
    selectStall,
    resolveSelectedStall,
    calculateCrowd,
    crowdLabel,
    getCart,
    saveCart,
    addToCart,
    calculateLineTotal,
    getCartSummary,
    updateCartCount,
    createOrder,
    getVisibleOrders,
    isPromotionActive,
    hygieneText,
    hygieneBadgeClass,
    crowdBadgeClass,
    renderHeader,
    renderFooter,
    initPage,
    resetDemoData
  };
})(window);
