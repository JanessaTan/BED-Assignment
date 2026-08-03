document.addEventListener("DOMContentLoaded", async function initialiseMenuManagement() {
  "use strict";

  if (!HC.initPage("menu-management", ["vendor"])) return;

  const currentUser = HC.getCurrentUser();
  const modal = document.getElementById("menuModal");
  const form = document.getElementById("menuItemForm");
  const tableBody = document.getElementById("menuTableBody");
  const emptyState = document.getElementById("menuManagementEmpty");
  const formError = document.getElementById("menuFormError");
  const submitButton = form.querySelector('button[type="submit"]');

  let stallId = null;
  let menuItems = [];
  let cuisines = [];

  document.getElementById("addMenuItem").addEventListener("click", () => openModal(null));
  document.getElementById("closeMenuModal").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  tableBody.addEventListener("click", handleTableAction);
  form.addEventListener("submit", saveMenuItem);

  try {
    await loadPage();
  } catch (error) {
    console.error("Menu management retrieval failed:", error);
    emptyState.hidden = false;
    emptyState.textContent = error.message || "Unable to load menu management data.";
  }

  async function loadPage() {
    stallId = await resolveVendorStallId();

    const [cuisineResponse, menuResponse] = await Promise.all([
      apiGet("/cuisines"),
      apiGet(`/menu-items?stallId=${encodeURIComponent(stallId)}&limit=100`)
    ]);

    cuisines = Array.isArray(cuisineResponse?.data) ? cuisineResponse.data : [];
    menuItems = Array.isArray(menuResponse?.data) ? menuResponse.data : [];

    addCuisineSuggestions();
    render();
  }

  async function resolveVendorStallId() {
    const directStallId = Number(currentUser?.stallId);
    if (Number.isInteger(directStallId) && directStallId > 0) {
      return directStallId;
    }

    const response = await apiGet("/stalls?limit=100");
    const stalls = Array.isArray(response?.data) ? response.data : [];
    const userId = Number(currentUser?.userId);

    const ownedStall = stalls.find((stall) => {
      const vendorId = Number(
        stall.vendorId ??
        stall.vendorUserId ??
        stall.ownerId ??
        stall.userId
      );
      return Number.isInteger(userId) && vendorId === userId;
    });

    const resolvedStallId = Number(ownedStall?.stallId);
    if (!Number.isInteger(resolvedStallId) || resolvedStallId < 1) {
      throw new Error(
        "No stall is linked to this Vendor account. Create or assign a stall before managing menu items."
      );
    }

    return resolvedStallId;
  }

  function addCuisineSuggestions() {
    const input = document.getElementById("itemCuisines");
    let list = document.getElementById("cuisineSuggestions");

    if (!list) {
      list = document.createElement("datalist");
      list.id = "cuisineSuggestions";
      document.body.appendChild(list);
    }

    list.innerHTML = cuisines
      .map((cuisine) => `<option value="${HC.escapeHtml(cuisine.name)}"></option>`)
      .join("");
    input.setAttribute("list", list.id);
  }

  function render() {
    emptyState.hidden = menuItems.length > 0;
    tableBody.innerHTML = menuItems.map((item) => {
      const itemId = Number(item.menuItemId);
      const cuisineNames = Array.isArray(item.cuisines) ? item.cuisines : [];
      const isAvailable = Boolean(item.isAvailable);

      return `
        <tr data-item="${itemId}">
          <td>
            <strong>${HC.escapeHtml(item.name)}</strong><br>
            <span class="muted">${HC.escapeHtml(item.description)}</span>
          </td>
          <td>${HC.escapeHtml(item.category)}</td>
          <td>${HC.formatCurrency(Number(item.price))}</td>
          <td>${cuisineNames.map(HC.escapeHtml).join(", ")}</td>
          <td>
            <button
              class="btn ${isAvailable ? "btn-secondary" : "btn-muted"} availability-toggle"
              type="button"
              data-action="toggle"
            >${isAvailable ? "Available" : "Unavailable"}</button>
          </td>
          <td>
            <div class="card-actions">
              <button class="btn btn-outline" type="button" data-action="edit">Edit</button>
              <button class="btn btn-danger" type="button" data-action="delete">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join("");
  }

  function openModal(item) {
    form.reset();
    formError.textContent = "";

    document.getElementById("menuModalTitle").textContent =
      item ? "Edit menu item" : "Add menu item";
    document.getElementById("editMenuId").value = item?.menuItemId || "";
    document.getElementById("itemName").value = item?.name || "";
    document.getElementById("itemCategory").value = item?.category || "";
    document.getElementById("itemPrice").value = item?.price || "";
    document.getElementById("itemPrep").value = item?.preparationMinutes || "";
    document.getElementById("itemCuisines").value =
      Array.isArray(item?.cuisines) ? item.cuisines.join(", ") : "";
    document.getElementById("itemDescription").value = item?.description || "";
    document.getElementById("itemAddOns").value =
      Array.isArray(item?.addOns)
        ? item.addOns.map((addOn) => `${addOn.name}:${addOn.price}`).join(", ")
        : "";
    document.getElementById("itemAvailable").checked =
      item ? Boolean(item.isAvailable) : true;

    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("itemName").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  async function handleTableAction(event) {
    const button = event.target.closest("[data-action]");
    const row = event.target.closest("[data-item]");
    if (!button || !row) return;

    const action = button.dataset.action;
    const itemId = Number(row.dataset.item);
    const item = menuItems.find(
      (candidate) => Number(candidate.menuItemId) === itemId
    );
    if (!item) return;

    if (action === "edit") {
      openModal(item);
      return;
    }

    try {
      button.disabled = true;

      if (action === "toggle") {
        const payload = toApiPayload({
          ...item,
          isAvailable: !Boolean(item.isAvailable)
        });
        const response = await apiPut(`/menu-items/${itemId}`, payload);
        HC.showToast(response.message || "Menu-item availability updated.");
      }

      if (
        action === "delete" &&
        window.confirm(`Make ${item.name} unavailable?`)
      ) {
        const response = await apiDelete(`/menu-items/${itemId}`);
        HC.showToast(response?.message || `${item.name} made unavailable.`);
      }

      await reloadMenuItems();
    } catch (error) {
      console.error("Menu-item action failed:", error);
      HC.showToast(error.message || "Unable to update the menu item.");
    } finally {
      button.disabled = false;
    }
  }

  async function saveMenuItem(event) {
    event.preventDefault();
    formError.textContent = "";

    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value.trim();
    const price = Number(document.getElementById("itemPrice").value);
    const preparationMinutes = Number(document.getElementById("itemPrep").value);
    const cuisineNames = document.getElementById("itemCuisines").value
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const description = document.getElementById("itemDescription").value.trim();

    if (
      name.length < 2 ||
      category.length < 2 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(preparationMinutes) ||
      preparationMinutes < 1 ||
      preparationMinutes > 240 ||
      cuisineNames.length === 0 ||
      description.length < 5
    ) {
      formError.textContent =
        "Complete every required field using a positive price, a preparation time from 1 to 240 minutes, and a useful description.";
      return;
    }

    let cuisineIds;
    try {
      cuisineIds = resolveCuisineIds(cuisineNames);
    } catch (error) {
      formError.textContent = error.message;
      return;
    }

    let addOns;
    try {
      addOns = parseAddOns(document.getElementById("itemAddOns").value);
    } catch (error) {
      formError.textContent = error.message;
      return;
    }
    const payload = {
      stallId,
      name,
      category,
      description,
      price,
      preparationMinutes,
      isAvailable: document.getElementById("itemAvailable").checked,
      cuisineIds,
      addOns
    };
    const editId = Number(document.getElementById("editMenuId").value);

    try {
      setSaving(true);

      const response = Number.isInteger(editId) && editId > 0
        ? await apiPut(`/menu-items/${editId}`, payload)
        : await apiPost("/menu-items", payload);

      HC.showToast(
        response.message ||
        (editId ? "Menu item updated." : "Menu item created.")
      );
      closeModal();
      await reloadMenuItems();
    } catch (error) {
      console.error("Menu-item save failed:", error);
      formError.textContent = error.message || "Unable to save the menu item.";
    } finally {
      setSaving(false);
    }
  }

  function resolveCuisineIds(names) {
    const cuisineByName = new Map(
      cuisines.map((cuisine) => [
        String(cuisine.name).trim().toLowerCase(),
        Number(cuisine.cuisineId)
      ])
    );
    const unknownNames = names.filter(
      (name) => !cuisineByName.has(name.toLowerCase())
    );

    if (unknownNames.length > 0) {
      throw new Error(
        `Unknown cuisine: ${unknownNames.join(", ")}. Use an existing cuisine name.`
      );
    }

    return [...new Set(names.map((name) => cuisineByName.get(name.toLowerCase())))];
  }

  function parseAddOns(rawValue) {
    const value = rawValue.trim();
    if (!value) return [];

    return value.split(",").map((entry) => {
      const separatorIndex = entry.lastIndexOf(":");
      const name = separatorIndex >= 0
        ? entry.slice(0, separatorIndex).trim()
        : "";
      const price = separatorIndex >= 0
        ? Number(entry.slice(separatorIndex + 1).trim())
        : Number.NaN;

      if (!name || !Number.isFinite(price) || price < 0 || price > 1000) {
        throw new Error(
          `Invalid add-on "${entry.trim()}". Use Name:Price, for example Extra Rice:1.`
        );
      }

      return { name, price };
    });
  }

  function toApiPayload(item) {
    return {
      stallId: Number(item.stallId),
      name: item.name,
      category: item.category,
      description: item.description,
      price: Number(item.price),
      preparationMinutes: Number(item.preparationMinutes),
      isAvailable: Boolean(item.isAvailable),
      cuisineIds: (item.cuisineIds || []).map(Number),
      addOns: (item.addOns || []).map((addOn) => ({
        name: addOn.name,
        price: Number(addOn.price)
      }))
    };
  }

  async function reloadMenuItems() {
    const response = await apiGet(
      `/menu-items?stallId=${encodeURIComponent(stallId)}&limit=100`
    );
    menuItems = Array.isArray(response?.data) ? response.data : [];
    render();
  }

  function setSaving(saving) {
    if (!submitButton) return;
    submitButton.disabled = saving;
    submitButton.textContent = saving ? "Saving..." : "Save menu item";
  }
});
