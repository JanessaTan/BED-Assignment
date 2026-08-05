(function createHawkerHub(global) {
  "use strict";

  const KEYS = {
    authToken: "hc.authToken",
    currentUser: "hc.currentUser",
    guestMode: "hc.guestMode",
    selectedCentre: "hc.selectedCentre",
    selectedStall: "hc.selectedStall",
    cart: "hc.cart",
    likes: "hc.likes",
    migration: "hc.cleanApiMigration.v1",
    orders: "hc.orders",
    feedback: "hc.feedback",
    complaints: "hc.complaints",
    promotions: "hc.promotions",
    crowdLevels: "hc.crowdLevels",
    menuItems: "hc.menuItems",
    ratings: "hc.ratings",
    inspections: "hc.inspections",
    rentalAgreements: "hc.rentalAgreements",
    stallOperations: "hc.stallOperations"
  };

  const LEGACY_AUTH_KEYS = ["hc.users", "hc.role", "authToken", "currentUser"];
  const DEMO_DATA_KEYS = [
    KEYS.orders,
    KEYS.feedback,
    KEYS.complaints,
    KEYS.promotions,
    KEYS.crowdLevels,
    KEYS.menuItems,
    KEYS.ratings,
    KEYS.inspections,
    KEYS.rentalAgreements,
    KEYS.stallOperations
  ];

  const CUSTOMER_NAV = [
    ["home", "Home", "home.html"],
    ["browse", "Browse Hawker Centres", "browse-hawker-centres.html"],
    ["crowd", "Crowd Level", "crowd-level.html"],
    ["promotion", "Promotions", "promotion.html"],
    ["cart", "Cart", "cart.html"],
    ["history", "Order History", "order-history.html"],
    ["feedback", "Feedback", "feedback.html"],
    ["profile", "My Profile", "profile.html"]
  ];

  const VENDOR_NAV = [
    ["dashboard", "Vendor Dashboard", "vendor-dashboard.html"],
    ["stall-management", "Stall Management", "stall-management.html"],
    ["menu-management", "Menu Management", "menu-management.html"],
    ["orders", "Orders", "order.html"],
    ["promotion-management", "Promotions", "promotion-management.html"],
    ["rental", "Rental Agreement", "rental-agreement.html"],
    ["analytics", "Sales Analytics", "sales-analytics.html"],
    ["profile", "My Profile", "profile.html"]
  ];

  const NEA_NAV = [
    ["nea-dashboard", "NEA Dashboard", "nea-dashboard.html"],
    ["inspections", "Inspections & Grades", "nea-inspections.html"],
    ["profile", "My Profile", "profile.html"]
  ];

  const OPERATOR_NAV = [
    ["operator-dashboard", "Operator Dashboard", "operator-dashboard.html"],
    ["centre-operations", "Centre Operations", "centre-operations.html"],
    ["rental-management", "Rental Management", "rental-management.html"],
    ["complaint-management", "Complaints", "complaint-management.html"],
    ["profile", "My Profile", "profile.html"]
  ];

  const ADMIN_NAV = [
    ["admin-users", "User Management", "admin-users.html"],
    ["profile", "My Profile", "profile.html"]
  ];

  const state = {
    centres: [],
    stalls: [],
    menuItems: [],
    promotions: []
  };

  const API_BASE = (() => {
    if (typeof global.HC_API_BASE === "string" && global.HC_API_BASE.trim()) {
      return global.HC_API_BASE.replace(/\/$/, "");
    }

    const liveServerPorts = new Set(["5500", "5501"]);
    if (global.location.protocol === "file:" || liveServerPorts.has(global.location.port)) {
      return "http://localhost:3000/api";
    }

    return "/api";
  })();

  function loadData(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue === null ? fallback : JSON.parse(rawValue);
    } catch (error) {
      console.warn(`Could not read browser data for ${key}.`, error);
      return fallback;
    }
  }

  function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function sameId(left, right) {
    return left !== null && left !== undefined && right !== null && right !== undefined && String(left) === String(right);
  }

  function firstDefined(object, keys, fallback = null) {
    for (const key of keys) {
      if (object && object[key] !== undefined && object[key] !== null) return object[key];
    }
    return fallback;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function booleanValue(value, fallback = true) {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const normalized = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "active", "available", "open"].includes(normalized)) return true;
    if (["false", "0", "no", "inactive", "unavailable", "closed"].includes(normalized)) return false;
    return fallback;
  }

  function stringList(value) {
    if (Array.isArray(value)) {
      return value
        .map((entry) => typeof entry === "object" ? firstDefined(entry, ["name", "cuisineName", "title"], "") : entry)
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
    }
    return String(value || "")
      .split(/[|,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function extractCollection(payload, candidateKeys) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    for (const key of candidateKeys) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    for (const containerKey of ["data", "result", "response", "payload"]) {
      const nested = payload[containerKey];
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === "object") {
        for (const key of candidateKeys) {
          if (Array.isArray(nested[key])) return nested[key];
        }
      }
    }

    return [];
  }

  function extractRecord(payload, candidateKeys) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload || null;
    for (const key of candidateKeys) {
      if (payload[key] && typeof payload[key] === "object" && !Array.isArray(payload[key])) return payload[key];
    }
    if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
      for (const key of candidateKeys) {
        if (payload.data[key] && typeof payload.data[key] === "object" && !Array.isArray(payload.data[key])) return payload.data[key];
      }
      return payload.data;
    }
    return payload;
  }

  async function apiRequest(path, options = {}) {
    const preparedOptions = { ...options };
    const preparedHeaders = new Headers(options.headers || {});

    if (preparedOptions.body !== undefined && !(preparedOptions.body instanceof FormData)) {
      if (!preparedHeaders.has("Content-Type")) preparedHeaders.set("Content-Type", "application/json");
      if (preparedHeaders.get("Content-Type")?.includes("application/json") && typeof preparedOptions.body !== "string") {
        preparedOptions.body = JSON.stringify(preparedOptions.body);
      }
    }
    preparedOptions.headers = Object.fromEntries(preparedHeaders.entries());

    options = preparedOptions;
    const normalizedPath = String(path || "");
    const url = /^https?:\/\//i.test(normalizedPath)
      ? normalizedPath
      : `${API_BASE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const token = getAuthToken();
    if (token && options.auth !== false && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const fetchOptions = { ...options, headers };
    delete fetchOptions.auth;
    if (fetchOptions.body && headers.get("Content-Type") === "application/json" && typeof fetchOptions.body !== "string") {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      const error = new Error(payload?.message || payload?.error || `Request failed with status ${response.status}.`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function normalizeCentre(raw) {
    const id = firstDefined(raw, ["centreId", "centre_id", "hawkerCentreId", "id"]);
    return {
      ...raw,
      id,
      centreId: id,
      name: String(firstDefined(raw, ["name", "centreName", "centre_name"], "Unnamed hawker centre")),
      town: String(firstDefined(raw, ["town", "area", "region", "district"], "")),
      address: String(firstDefined(raw, ["address", "location", "centreAddress", "centre_address"], "")),
      mrt: String(firstDefined(raw, ["mrt", "nearestMrt", "nearestMRT", "nearest_mrt"], "")),
      hours: String(firstDefined(raw, ["openingHours", "opening_hours", "hours", "operatingHours"], "")),
      description: String(firstDefined(raw, ["description", "details"], "")),
      isActive: booleanValue(firstDefined(raw, ["isActive", "is_active", "active"], true), true),
      stallCount: numberOrNull(firstDefined(raw, ["stallCount", "stall_count", "numberOfStalls"])),
      crowdPercentage: numberOrNull(firstDefined(raw, ["crowdPercentage", "crowd_percentage", "occupancyPercentage", "occupancy"])),
      crowdLabel: firstDefined(raw, ["crowdLabel", "crowd_label", "crowdLevel", "crowd_level"], null)
    };
  }

  function normalizeStall(raw) {
    const id = firstDefined(raw, ["stallId", "stall_id", "id"]);
    const centreId = firstDefined(raw, ["centreId", "centre_id", "hawkerCentreId"]);
    const cuisines = stringList(firstDefined(raw, ["cuisines", "cuisineNames", "cuisine", "cuisineName"], []));
    return {
      ...raw,
      id,
      stallId: id,
      centreId,
      name: String(firstDefined(raw, ["name", "stallName", "stall_name"], "Unnamed stall")),
      unitNumber: String(firstDefined(raw, ["unitNumber", "unit_number", "unit"], "")),
      description: String(firstDefined(raw, ["description", "details"], "")),
      hours: String(firstDefined(raw, ["openingHours", "opening_hours", "hours", "operatingHours"], "")),
      cuisines,
      cuisine: cuisines.join(" · ") || "Unspecified",
      isActive: booleanValue(firstDefined(raw, ["isActive", "is_active", "active"], true), true),
      rating: numberOrNull(firstDefined(raw, ["averageRating", "average_rating", "rating"])),
      feedbackCount: numberOrNull(firstDefined(raw, ["feedbackCount", "feedback_count", "ratingCount"])),
      popularity: numberOrNull(firstDefined(raw, ["popularity", "popularityScore", "popularity_score"])),
      crowd: numberOrNull(firstDefined(raw, ["crowd", "crowdPercentage", "crowd_percentage"])),
      hygieneGrade: firstDefined(raw, ["hygieneGrade", "hygiene_grade", "grade", "hygiene"], null),
      hygieneScore: numberOrNull(firstDefined(raw, ["hygieneScore", "hygiene_score", "score"])),
      centreName: String(firstDefined(raw, ["centreName", "centre_name"], "")),
      promotionId: firstDefined(raw, ["promotionId", "promotion_id"], null)
    };
  }

  function normalizeAddOn(raw) {
    const id = firstDefined(raw, ["addOnId", "addonId", "menuAddOnId", "add_on_id", "id"]);
    return {
      ...raw,
      id,
      addOnId: id,
      name: String(firstDefined(raw, ["name", "addOnName", "addonName", "title"], "Add-on")),
      price: numberOrNull(firstDefined(raw, ["price", "additionalPrice", "additional_price"], 0)) || 0,
      isAvailable: booleanValue(firstDefined(raw, ["isAvailable", "is_available", "active"], true), true)
    };
  }

  function normalizeMenuItem(raw) {
    const id = firstDefined(raw, ["menuItemId", "menu_item_id", "itemId", "id"]);
    const stallId = firstDefined(raw, ["stallId", "stall_id"]);
    const cuisines = stringList(firstDefined(raw, ["cuisines", "cuisineNames", "cuisine", "cuisineName"], []));
    const rawAddOns = firstDefined(raw, ["addOns", "addons", "menuAddOns", "menu_add_ons"], []);
    return {
      ...raw,
      id,
      menuItemId: id,
      stallId,
      likeStallID: firstDefined(raw, ["likeStallID", "LikeStallID", "StallID"], null),
      likeItemCode: firstDefined(raw, ["likeItemCode", "LikeItemCode", "ItemCode"], null),
      stallName: String(firstDefined(raw, ["stallName", "stall_name"], "")),
      name: String(firstDefined(raw, ["name", "itemName", "menuItemName"], "Unnamed menu item")),
      category: String(firstDefined(raw, ["category", "categoryName"], "Other")),
      description: String(firstDefined(raw, ["description", "details"], "")),
      price: numberOrNull(firstDefined(raw, ["price", "unitPrice", "unit_price"], 0)) || 0,
      cuisines,
      available: booleanValue(firstDefined(raw, ["isAvailable", "is_available", "available"], true), true),
      prep: numberOrNull(firstDefined(raw, ["preparationMinutes", "preparation_minutes", "prep", "prepMinutes"])),
      likes: numberOrNull(firstDefined(raw, ["likes", "likeCount", "like_count"], 0)) || 0,
      addOns: Array.isArray(rawAddOns) ? rawAddOns.map(normalizeAddOn).filter((item) => item.isAvailable) : []
    };
  }

  function normalizePromotion(raw) {
    const id = firstDefined(raw, ["promotionId", "promotion_id", "id"]);
    const eligibleItemIds = firstDefined(raw, ["eligibleItemIds", "menuItemIds", "eligibleMenuItemIds", "menu_item_ids"], []);
    return {
      ...raw,
      id,
      promotionId: id,
      centreId: firstDefined(raw, ["centreId", "centre_id"], null),
      stallId: firstDefined(raw, ["stallId", "stall_id"], null),
      title: String(firstDefined(raw, ["title", "name", "promotionName", "promotion_name"], "Promotion")),
      description: String(firstDefined(raw, ["description", "details"], "")),
      discountType: String(firstDefined(raw, ["discountType", "discount_type", "type"], "fixed")).toLowerCase(),
      discountValue: numberOrNull(firstDefined(raw, ["discountValue", "discount_value", "discount", "amount"], 0)) || 0,
      start: firstDefined(raw, ["startDate", "start_date", "start"], null),
      end: firstDefined(raw, ["endDate", "end_date", "end"], null),
      isActive: booleanValue(firstDefined(raw, ["isActive", "is_active", "active"], true), true),
      eligibleItemIds: Array.isArray(eligibleItemIds)
        ? eligibleItemIds.map((item) => typeof item === "object" ? firstDefined(item, ["menuItemId", "menu_item_id", "id"]) : item).filter((item) => item !== null && item !== undefined)
        : stringList(eligibleItemIds)
    };
  }

  function replaceState(key, values, normalizer) {
    state[key].splice(0, state[key].length, ...values.map(normalizer).filter((item) => item.id !== null && item.id !== undefined));
    return state[key];
  }

  function mergeState(key, values, normalizer) {
    const normalized = values.map(normalizer).filter((item) => item.id !== null && item.id !== undefined);
    normalized.forEach((item) => {
      const index = state[key].findIndex((existing) => sameId(existing.id, item.id));
      if (index >= 0) state[key][index] = item;
      else state[key].push(item);
    });
    return normalized;
  }

  async function fetchCentres(params = {}) {
    const query = new URLSearchParams({ limit: String(params.limit || 100) });
    if (params.search) query.set("search", params.search);
    const payload = await apiRequest(`/hawker-centres?${query}`);
    const records = extractCollection(payload, ["centres", "hawkerCentres", "items", "records", "results"]);
    return replaceState("centres", records, normalizeCentre);
  }

  async function fetchCentreById(centreId) {
    const cached = getCentreById(centreId);
    if (cached) return cached;
    const payload = await apiRequest(`/hawker-centres/${encodeURIComponent(centreId)}`);
    const record = extractRecord(payload, ["centre", "hawkerCentre"]);
    return mergeState("centres", [record], normalizeCentre)[0] || null;
  }

  async function fetchStalls(params = {}) {
    const hasCentreId = params.centreId !== undefined && params.centreId !== null && String(params.centreId).trim() !== "";
    const query = new URLSearchParams({ limit: String(params.limit || 100) });
    if (params.search) query.set("search", params.search);

    const endpoint = hasCentreId
      ? `/hawker-centres/${encodeURIComponent(params.centreId)}/stalls${query.toString() ? `?${query}` : ""}`
      : `/stalls${query.toString() ? `?${query}` : ""}`;

    const payload = await apiRequest(endpoint);
    const records = extractCollection(payload, ["stalls", "items", "records", "results"]);
    const normalized = records.map(normalizeStall).filter((item) => item.id !== null && item.id !== undefined);

    if (hasCentreId) {
      state.stalls = state.stalls.filter((stall) => !sameId(stall.centreId, params.centreId));
      normalized.forEach((stall) => {
        if (stall.centreId === null || stall.centreId === undefined) stall.centreId = params.centreId;
      });
      state.stalls.push(...normalized);
      return normalized;
    }

    return replaceState("stalls", records, normalizeStall);
  }

  async function fetchStallById(stallId) {
    const cached = getStallById(stallId);
    if (cached) return cached;
    const payload = await apiRequest(`/stalls/${encodeURIComponent(stallId)}`);
    const record = extractRecord(payload, ["stall"]);
    return mergeState("stalls", [record], normalizeStall)[0] || null;
  }

  async function fetchMenuItems(params = {}) {
    const query = new URLSearchParams({ limit: String(params.limit || 100) });
    if (params.stallId !== undefined && params.stallId !== null) query.set("stallId", String(params.stallId));
    if (params.search) query.set("search", params.search);
    if (params.availableOnly) query.set("available", "true");
    const payload = await apiRequest(`/menu-items?${query}`);
    const records = extractCollection(payload, ["menuItems", "menu_items", "items", "records", "results"]);
    const normalized = records.map(normalizeMenuItem).filter((item) => item.id !== null && item.id !== undefined);
    if (params.stallId !== undefined && params.stallId !== null) {
      state.menuItems = state.menuItems.filter((item) => !sameId(item.stallId, params.stallId));
      state.menuItems.push(...normalized);
      return normalized.filter((item) => sameId(item.stallId, params.stallId));
    }
    return replaceState("menuItems", records, normalizeMenuItem);
  }

  async function fetchPromotions(params = {}) {
    const query = new URLSearchParams({ limit: String(params.limit || 100) });
    if (params.stallId !== undefined && params.stallId !== null) query.set("stallId", String(params.stallId));
    if (params.centreId !== undefined && params.centreId !== null) query.set("centreId", String(params.centreId));
    const payload = await apiRequest(`/promotions?${query}`);
    const records = extractCollection(payload, ["promotions", "items", "records", "results"]);
    return replaceState("promotions", records, normalizePromotion);
  }

  async function fetchPromotionById(promotionId) {
    const cached = getPromotionById(promotionId);
    if (cached && cached.eligibleItemIds.length) return cached;
    const payload = await apiRequest(`/promotions/${encodeURIComponent(promotionId)}`);
    const record = extractRecord(payload, ["promotion"]);
    return mergeState("promotions", [record], normalizePromotion)[0] || null;
  }
  function normalizeInspection(raw) {
    if (!raw) return null;
    return {
      id: firstDefined(raw, ["InspectionID", "inspectionId"], null),
      stallId: firstDefined(raw, ["StallID", "stallId"], null),
      date: firstDefined(raw, ["InspectionDate", "inspectionDate"], null),
      validUntil: firstDefined(raw, ["GradeExpiry", "gradeExpiry"], null),
      grade: firstDefined(raw, ["HygieneGrade", "grade"], null),
      officerId: firstDefined(raw, ["OfficerID", "officerId"], null),
      remarks: firstDefined(raw, ["InspectionRemark", "remarks"], "")
    };
  }

  async function fetchCurrentInspection(stallId) {
    try {
      const payload = await apiRequest(`/hygiene/${encodeURIComponent(stallId)}`);
      return normalizeInspection(payload);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  function normalizeRole(role) {
    const normalized = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const roleMap = {
      patron: "customer",
      customer: "customer",
      vendor: "vendor",
      neaofficer: "nea_officer",
      nea_officer: "nea_officer",
      operator: "operator",
      hawker_centre_operator: "operator",
      administrator: "administrator",
      admin: "administrator",
      guest: "guest"
    };
    return roleMap[normalized] || normalized;
  }

  function sanitizeUser(user) {
    if (!user || typeof user !== "object") return null;
    const safeUser = { ...user };
    ["password", "Password", "passwordHash", "PasswordHash", "password_hash", "hashedPassword", "hashed_password", "token", "accessToken", "refreshToken"].forEach((field) => delete safeUser[field]);
    safeUser.id = firstDefined(user, ["id", "userId", "UserID", "user_id", "sub"], null);
    safeUser.userId = safeUser.id;
    safeUser.name = String(firstDefined(user, ["name", "fullName", "FullName", "username", "email"], "HawkerHub user"));
    safeUser.fullName = String(firstDefined(user, ["fullName", "FullName", "name"], safeUser.name));
    safeUser.email = firstDefined(user, ["email", "Email"], null);
    safeUser.phone = firstDefined(user, ["phone", "Phone"], null);
    safeUser.accountStatus = firstDefined(user, ["accountStatus", "AccountStatus", "status"], null);
    safeUser.role = normalizeRole(firstDefined(user, ["role", "roleName", "RoleName", "role_name"], ""));
    safeUser.roleName = firstDefined(user, ["roleName", "RoleName", "role"], null);
    return safeUser;
  }

  function getAuthToken() {
    return localStorage.getItem(KEYS.authToken);
  }

  function decodeJwtPayload(token) {
    try {
      const payload = String(token).split(".")[1];
      if (!payload) return null;
      const base64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
      const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
      const decoded = decodeURIComponent(atob(paddedPayload).split("").map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
      return JSON.parse(decoded);
    } catch (error) {
      console.warn("Could not read the authentication token.", error);
      return null;
    }
  }

  function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    return Boolean(payload?.exp && Date.now() >= Number(payload.exp) * 1000);
  }

  function getCurrentUser() {
    const storedUser = loadData(KEYS.currentUser, null);
    if (storedUser) return sanitizeUser(storedUser);
    const token = getAuthToken();
    const payload = token ? decodeJwtPayload(token) : null;
    return payload ? sanitizeUser(payload) : null;
  }

  function setCurrentUser(user) {
    const safeUser = sanitizeUser(user);
    if (!safeUser) {
      localStorage.removeItem(KEYS.currentUser);
      return null;
    }
    saveData(KEYS.currentUser, safeUser);
    return safeUser;
  }

  function setAuthSession(token, user) {
    if (!token) throw new Error("An authentication token is required.");
    localStorage.removeItem(KEYS.guestMode);
    localStorage.setItem(KEYS.authToken, token);
    return setCurrentUser(user);
  }

  function setGuestSession() {
    clearAuthSession();
    localStorage.setItem(KEYS.guestMode, "true");
    return setCurrentUser({ id: "guest", fullName: "Guest", role: "guest", roleName: "Guest", accountStatus: "Guest" });
  }

  function isGuestSession() {
    return localStorage.getItem(KEYS.guestMode) === "true" && getRole() === "guest";
  }

  function clearAuthSession() {
    localStorage.removeItem(KEYS.authToken);
    localStorage.removeItem(KEYS.currentUser);
    localStorage.removeItem(KEYS.guestMode);
    LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function getRole() {
    return normalizeRole(getCurrentUser()?.role || "");
  }

  function getLandingPage(roleInput) {
    const landingPages = {
      customer: "home.html",
      guest: "home.html",
      vendor: "vendor-dashboard.html",
      nea_officer: "nea-dashboard.html",
      operator: "operator-dashboard.html",
      administrator: "admin-users.html"
    };
    return landingPages[normalizeRole(roleInput || getRole())] || "login.html";
  }

  function requireLogin() {
    if (isGuestSession()) return true;
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      clearAuthSession();
      const next = encodeURIComponent(global.location.pathname + global.location.search);
      global.location.replace(`login.html?next=${next}`);
      return false;
    }
    return true;
  }

  function requireRole(allowedRoles) {
    if (!requireLogin()) return false;
    const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(normalizeRole);
    const role = getRole();
    if (allowed.includes(role)) return true;
    showToast("That page is not available for your account role.", "error");
    global.setTimeout(() => global.location.replace(getLandingPage(role)), 250);
    return false;
  }

  async function logout() {
    try {
      if (getAuthToken()) await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Server logout was not completed.", error);
    } finally {
      clearAuthSession();
      global.location.replace("login.html");
    }
  }

  function getQueryParameter(name) {
    return new URLSearchParams(global.location.search).get(name);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(Number(value) || 0);
  }

  function formatDate(value, includeTime) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", ...(includeTime ? { timeStyle: "short" } : {}) }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message, type = "") {
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
    toast.className = `toast ${type ? `toast-${type}` : ""}`.trim();
    toast.textContent = String(message || "");
    region.appendChild(toast);
    global.setTimeout(() => toast.remove(), 4500);
  }

  function getCentreById(id) {
    return state.centres.find((centre) => sameId(centre.id, id)) || null;
  }

  function getStallById(id) {
    return state.stalls.find((stall) => sameId(stall.id, id)) || null;
  }

  function getPromotionById(id) {
    return state.promotions.find((promotion) => sameId(promotion.id, id)) || null;
  }

  function getMenuItems() {
    return state.menuItems;
  }

  function getStallCount(centreId) {
    const centre = getCentreById(centreId);
    return centre?.stallCount ?? state.stalls.filter((stall) => sameId(stall.centreId, centreId)).length;
  }

  function selectCentre(centreId) {
    saveData(KEYS.selectedCentre, centreId);
    global.location.href = `stalls.html?centre=${encodeURIComponent(centreId)}`;
  }

  function resolveSelectedCentre() {
    return getQueryParameter("centre") || loadData(KEYS.selectedCentre, null);
  }

  function selectStall(stallId) {
    saveData(KEYS.selectedStall, stallId);
    global.location.href = `menu-item.html?stall=${encodeURIComponent(stallId)}`;
  }

  function resolveSelectedStall() {
    return getQueryParameter("stall") || loadData(KEYS.selectedStall, null);
  }

  function crowdLabel(percentage) {
    const number = numberOrNull(percentage);
    if (number === null) return "Unknown";
    if (number < 35) return "Low";
    if (number < 60) return "Moderate";
    if (number < 80) return "High";
    return "Very High";
  }

  function calculateCrowd(centre) {
    const percentage = numberOrNull(centre?.crowdPercentage);
    return {
      percentage,
      label: centre?.crowdLabel || crowdLabel(percentage),
      seats: numberOrNull(firstDefined(centre, ["availableSeats", "available_seats"], null)),
      updatedAt: firstDefined(centre, ["crowdUpdatedAt", "crowd_updated_at", "updatedAt"], null)
    };
  }

  function getInspections(stallId) {
    const inspections = loadData(KEYS.inspections, []);
    return stallId ? inspections.filter((inspection) => sameId(inspection.stallId, stallId)) : inspections;
  }

  function getCurrentHygieneRecord(stallId) {
    return getInspections(stallId)
      .filter((inspection) => inspection.status === "Completed" && inspection.grade)
      .sort((a, b) => new Date(b.date || b.scheduledDate) - new Date(a.date || a.scheduledDate))[0] || null;
  }

  function isLegacyDemoId(value) {
    const text = String(value || "");
    return /^(menu-|promo-|review-|clementi-|bedok-|tampines-|jurong-|toa-payoh-|chinatown-)/i.test(text);
  }

  function migrateAwayFromDemoData() {
    if (localStorage.getItem(KEYS.migration) === "done") return;
    LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
    DEMO_DATA_KEYS.forEach((key) => localStorage.removeItem(key));

    const cart = loadData(KEYS.cart, []);
    const cleanCart = Array.isArray(cart)
      ? cart.filter((line) => !isLegacyDemoId(line?.menuItemId) && !isLegacyDemoId(line?.stallId))
      : [];
    saveData(KEYS.cart, cleanCart);
    if (!localStorage.getItem(KEYS.likes)) saveData(KEYS.likes, {});
    localStorage.setItem(KEYS.migration, "done");
  }

  function getCart() {
    const cart = loadData(KEYS.cart, []);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCart(cart) {
    saveData(KEYS.cart, Array.isArray(cart) ? cart : []);
    updateCartCount();
    return cart;
  }

  function addToCart(menuItemInput, quantity, selectedAddOns) {
    const menuItem = normalizeMenuItem(menuItemInput);
    if (menuItem.id === null || menuItem.id === undefined) throw new Error("A database menu item ID is required.");
    if (menuItem.stallId === null || menuItem.stallId === undefined) throw new Error("A database stall ID is required.");

    const itemQuantity = Math.max(1, Math.min(20, Number(quantity) || 1));
    const addOns = (selectedAddOns || []).map(normalizeAddOn);
    const signature = addOns.map((addOn) => String(addOn.id ?? addOn.name)).sort().join("|");
    const cart = getCart();
    const existing = cart.find((item) => sameId(item.menuItemId, menuItem.id) && item.addOnSignature === signature);

    if (existing) {
      existing.quantity = Math.min(20, Number(existing.quantity) + itemQuantity);
    } else {
      const stall = getStallById(menuItem.stallId);
      cart.push({
        cartLineId: global.crypto?.randomUUID?.() || `line-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        menuItemId: menuItem.id,
        stallId: menuItem.stallId,
        stallName: menuItem.stallName || stall?.name || "",
        name: menuItem.name,
        price: menuItem.price,
        quantity: itemQuantity,
        addOns,
        addOnSignature: signature
      });
    }

    return saveCart(cart);
  }

  function calculateLineTotal(line) {
    const addOnTotal = (line.addOns || []).reduce((sum, addOn) => sum + (Number(addOn.price) || 0), 0);
    const unitPrice = Number(line.price) || 0;
    const discount = Math.min(Math.max(Number(line.promotionDiscount) || 0, 0), unitPrice + addOnTotal);
    return (unitPrice + addOnTotal - discount) * Math.max(1, Number(line.quantity) || 1);
  }

  function getCartSummary(cartInput) {
    const cart = Array.isArray(cartInput) ? cartInput : getCart();
    const itemSubtotal = cart.reduce((sum, line) => sum + calculateLineTotal(line), 0);
    const stallIds = [...new Set(cart.map((line) => String(line.stallId)))];
    const packaging = cart.length ? stallIds.length * 0.3 : 0;
    return {
      itemSubtotal,
      packaging,
      total: itemSubtotal + packaging,
      itemCount: cart.reduce((sum, line) => sum + Math.max(1, Number(line.quantity) || 1), 0)
    };
  }

  function updateCartCount() {
    const count = getCartSummary().itemCount;
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.setAttribute("aria-label", `${count} items in cart`);
    });
  }

  function isPromotionActive(promotionInput) {
    const promotion = normalizePromotion(promotionInput || {});
    if (!promotion.isActive) return false;
    const now = new Date();
    if (promotion.start) {
      const start = new Date(promotion.start);
      if (!Number.isNaN(start.getTime()) && now < start) return false;
    }
    if (promotion.end) {
      const end = new Date(promotion.end);
      if (!Number.isNaN(end.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(promotion.end))) end.setHours(23, 59, 59, 999);
        if (now > end) return false;
      }
    }
    return true;
  }

  function promotionDiscountForLine(promotionInput, line) {
    const promotion = normalizePromotion(promotionInput || {});
    const value = Math.max(0, Number(promotion.discountValue) || 0);
    if (promotion.discountType.includes("percent")) return Math.min(Number(line.price) || 0, (Number(line.price) || 0) * value / 100);
    return Math.min(Number(line.price) || 0, value);
  }

  function hygieneText(grade) {
    if (!grade) return "Not graded";
    const labels = { A: "Excellent", B: "Good", C: "Satisfactory", D: "Needs Improvement" };
    return `Grade ${grade} - ${labels[grade] || "Not rated"}`;
  }

  function hygieneBadgeClass(grade) {
    if (grade === "A") return "badge-success";
    if (grade === "B") return "badge-info";
    if (grade === "C") return "badge-warning";
    if (grade === "D") return "badge-danger";
    return "badge-neutral";
  }

  function crowdBadgeClass(label) {
    if (label === "Low") return "badge-success";
    if (label === "Moderate") return "badge-info";
    if (label === "High") return "badge-warning";
    if (label === "Very High") return "badge-danger";
    return "badge-neutral";
  }

  function renderHeader(activePage, options) {
    const headerTarget = document.getElementById("siteHeader");
    if (!headerTarget) return;
    const user = getCurrentUser();
    const role = getRole();
    let navItems = [];
    if (role === "vendor") navItems = VENDOR_NAV;
    if (role === "customer" || role === "guest") navItems = CUSTOMER_NAV;
    if (role === "nea_officer") navItems = NEA_NAV;
    if (role === "operator") navItems = OPERATOR_NAV;
    if (role === "administrator") navItems = ADMIN_NAV;

    const navLinks = navItems.map(([key, label, href]) => {
      const cartBadge = key === "cart" ? '<span class="cart-count" data-cart-count>0</span>' : "";
      return `<a class="${key === "cart" ? "cart-link" : ""}" href="${href}" ${key === activePage ? 'aria-current="page"' : ""}>${label}${cartBadge}</a>`;
    }).join("");

    const accountControl = user
      ? `<button type="button" data-logout>Logout <span class="sr-only">${escapeHtml(user.name || user.email || "user")}</span></button>`
      : '<a href="login.html">Login</a>';

    headerTarget.innerHTML = `
      <a class="skip-link" href="#mainContent">Skip to main content</a>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="${getLandingPage(role)}" aria-label="HawkerHub home">
            <span class="brand-mark" aria-hidden="true">HH</span>
            <span>HawkerHub<small>Singapore hawker companion</small></span>
          </a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="siteNavigation">
            <span aria-hidden="true">☰</span><span class="sr-only">Open navigation</span>
          </button>
          <nav class="site-nav" id="siteNavigation" aria-label="Main navigation">${navLinks}${accountControl}</nav>
        </div>
      </header>`;

    const toggle = headerTarget.querySelector(".nav-toggle");
    const nav = headerTarget.querySelector(".site-nav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    headerTarget.querySelector("[data-logout]")?.addEventListener("click", logout);
    updateCartCount();
    if (options?.minimal && nav) nav.innerHTML = '<a href="credit.html">Credits</a>';
  }

  function renderFooter() {
    const footerTarget = document.getElementById("siteFooter");
    if (!footerTarget) return;
    const year = new Date().getFullYear();
    const role = getRole();
    let quickLinks;
    if (role === "administrator") quickLinks = '<li><a href="admin-users.html">User management</a></li><li><a href="profile.html">My profile</a></li>';
    else if (role === "nea_officer") quickLinks = '<li><a href="nea-dashboard.html">NEA dashboard</a></li><li><a href="nea-inspections.html">Inspections & grades</a></li><li><a href="profile.html">My profile</a></li>';
    else if (role === "operator") quickLinks = '<li><a href="centre-operations.html">Centre operations</a></li><li><a href="rental-management.html">Rental management</a></li><li><a href="profile.html">My profile</a></li>';
    else if (role === "vendor") quickLinks = '<li><a href="vendor-dashboard.html">Vendor dashboard</a></li><li><a href="menu-management.html">Menu management</a></li><li><a href="profile.html">My profile</a></li>';
    else quickLinks = '<li><a href="browse-hawker-centres.html">Browse centres</a></li><li><a href="crowd-level.html">Check crowd levels</a></li><li><a href="promotion.html">View promotions</a></li>';

    footerTarget.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <section>
            <h2>HawkerHub</h2>
            <p>A student web application for exploring Singapore hawker centres and managing role-specific services.</p>
          </section>
          <section>
            <h3>Quick links</h3>
            <ul>${quickLinks}</ul>
          </section>
          <section>
            <h3>Project</h3>
            <ul>
              <li><a href="credit.html">Credits and data notice</a></li>
            </ul>
          </section>
        </div>
        <div class="footer-bottom">&copy; ${year} HawkerHub. Educational project.</div>
      </footer>`;
  }

  function initPage(activePage, allowedRoles, options) {
    migrateAwayFromDemoData();
    if (allowedRoles && !requireRole(allowedRoles)) return false;
    renderHeader(activePage, options);
    renderFooter();
    return true;
  }

  function ensureSeedData() {
    migrateAwayFromDemoData();
  }

  function resetDemoData() {
    DEMO_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    saveCart([]);
    saveData(KEYS.likes, {});
    state.centres.length = 0;
    state.stalls.length = 0;
    state.menuItems.length = 0;
    state.promotions.length = 0;
  }

  function getCustomerIDFromCurrentUser() {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.name === "Guest") {
      return null;
    }

    const existingCustomerID =
      currentUser.customerID ||
      currentUser.CustomerID ||
      currentUser.customerId;

    if (existingCustomerID) {
      return String(existingCustomerID);
    }

    const rawUserID =
      currentUser.userId ||
      currentUser.id ||
      currentUser.UserID ||
      currentUser.user_id;

    const numericUserID = Number(rawUserID);

    if (
      Number.isInteger(numericUserID) &&
      numericUserID > 0 &&
      numericUserID <= 9999
    ) {
      return `C${String(numericUserID).padStart(4, "0")}`;
    }

    return null;
  }

  function extractOrderCollection(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.orders)) {
      return payload.orders;
    }

    if (Array.isArray(payload?.data?.orders)) {
      return payload.data.orders;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    if (Array.isArray(payload?.rows)) {
      return payload.rows;
    }

    return [];
  }

  function extractOrderRecord(payload) {
    if (!payload) {
      return null;
    }

    if (payload.OrderID || payload.orderID || payload.orderId || payload.id) {
      return payload;
    }

    if (payload.data) {
      return extractOrderRecord(payload.data);
    }

    if (payload.order) {
      return payload.order;
    }

    return payload;
  }

  async function fetchCustomerOrders(customerID) {
    if (!customerID) {
      return [];
    }

    const response = await apiRequest(
      `/orders/customer/${encodeURIComponent(customerID)}`
    );

    return extractOrderCollection(response);
  }

  async function fetchOrderById(orderID) {
    if (!orderID) {
      return null;
    }

    const response = await apiRequest(
      `/orders/${encodeURIComponent(orderID)}`
    );

    const order = extractOrderRecord(response);

    if (!order) {
      return null;
    }

    const normalizedOrderID =
      order.OrderID ||
      order.orderID ||
      order.orderId ||
      order.id;

    return {
      ...order,
      id: normalizedOrderID,
      OrderID: normalizedOrderID,
      items:
        order.items ||
        order.orderItems ||
        order.OrderItems ||
        []
    };
  }

  async function fetchVisibleOrders() {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.name === "Guest") {
      return [];
    }

    const role = String(
      currentUser.role ||
      currentUser.roleName ||
      ""
    ).toLowerCase();

    let orders = [];

    if (role === "customer") {
      const customerID = getCustomerIDFromCurrentUser();

      if (!customerID) {
        return [];
      }

      orders = await fetchCustomerOrders(customerID);
    } else {
      orders = extractOrderCollection(await apiRequest("/orders"));
    }

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderID =
          order.OrderID ||
          order.orderID ||
          order.orderId ||
          order.id;

        const existingItems =
          order.items ||
          order.orderItems ||
          order.OrderItems ||
          [];

        if (existingItems.length) {
          return {
            ...order,
            id: orderID,
            OrderID: orderID,
            items: existingItems
          };
        }

        const orderWithItems = await fetchOrderById(orderID);

        return {
          ...order,
          ...(orderWithItems || {}),
          id: orderID,
          OrderID: orderID,
          items: orderWithItems?.items || []
        };
      })
    );
    return enrichedOrders;
  }

  async function getVisibleOrders() {
    return fetchVisibleOrders();
  }

  const HC = {
    KEYS,
    API_BASE,
    loadData,
    saveData,
    ensureSeedData,
    migrateAwayFromDemoData,
    apiRequest,
    extractCollection,
    extractRecord,
    normalizeCentre,
    normalizeStall,
    normalizeMenuItem,
    normalizePromotion,
    fetchCentres,
    fetchCentreById,
    fetchStalls,
    fetchStallById,
    fetchMenuItems,
    fetchCurrentInspection,
    fetchPromotions,
    fetchPromotionById,
    normalizeRole,
    sanitizeUser,
    getAuthToken,
    decodeJwtPayload,
    isTokenExpired,
    getCurrentUser,
    setCurrentUser,
    setAuthSession,
    setGuestSession,
    isGuestSession,
    clearAuthSession,
    getRole,
    getLandingPage,
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
    isPromotionActive,
    promotionDiscountForLine,
    hygieneText,
    hygieneBadgeClass,
    crowdBadgeClass,
    renderHeader,
    renderFooter,
    initPage,
    resetDemoData,
    getCustomerIDFromCurrentUser,
    fetchCustomerOrders,
    fetchOrderById,
    fetchVisibleOrders,
    getVisibleOrders,
  };

  Object.defineProperties(HC, {
    centres: { enumerable: true, get: () => state.centres },
    stalls: { enumerable: true, get: () => state.stalls },
    menuItems: { enumerable: true, get: () => state.menuItems },
    promotions: { enumerable: true, get: () => state.promotions },
    hygieneRecords: { enumerable: true, get: () => [] }
  });

  global.HC = HC;
})(window);
