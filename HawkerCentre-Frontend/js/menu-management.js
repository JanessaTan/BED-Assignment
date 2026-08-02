document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("menu-management", ["vendor"])) return;

  const modal = document.getElementById("menuModal");
  const form = document.getElementById("menuItemForm");
  const stallSelect = document.getElementById("managedStall");
  const cuisineSelect = document.getElementById("itemCuisines");
  const message = document.getElementById("menuManagementMessage");
  let items = [];

  document.getElementById("addMenuItem").addEventListener("click", () => openModal());
  document.getElementById("closeMenuModal").addEventListener("click", closeModal);
  stallSelect.addEventListener("change", loadItems);
  form.addEventListener("submit", saveMenuItem);
  document.getElementById("menuTableBody").addEventListener("click", handleTableAction);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  await loadSetup();

  async function loadSetup() {
    setMessage("Loading your stalls and cuisines...", "info");
    try {
      const [stallResponse, cuisineResponse] = await Promise.all([
        apiGet("/stalls/mine"),
        apiGet("/cuisines")
      ]);
      const stalls = stallResponse?.data || [];
      const cuisines = cuisineResponse?.data || [];

      stallSelect.innerHTML = stalls.map((stall) =>
        `<option value="${stall.stallId}">${HC.escapeHtml(stall.name)}</option>`
      ).join("");
      cuisineSelect.innerHTML = cuisines.map((cuisine) =>
        `<option value="${cuisine.cuisineId}">${HC.escapeHtml(cuisine.name)}</option>`
      ).join("");

      document.getElementById("addMenuItem").disabled = stalls.length === 0;
      if (!stalls.length) {
        items = [];
        render();
        setMessage("Create a stall before adding menu items.", "info");
        return;
      }
      await loadItems();
    } catch (error) {
      console.error("Menu setup failed:", error);
      setMessage(error.message || "Unable to load menu management.", "error");
    }
  }

  async function loadItems() {
    const stallId = Number(stallSelect.value);
    if (!stallId) return;
    setMessage("Loading menu items from the database...", "info");
    try {
      const response = await apiGet(`/menu-items?stallId=${stallId}&limit=100`);
      items = response?.data || [];
      render();
      clearMessage();
    } catch (error) {
      items = [];
      render();
      setMessage(error.message || "Unable to retrieve menu items.", "error");
    }
  }

  function render() {
    document.getElementById("menuManagementEmpty").hidden = items.length > 0;
    document.getElementById("menuTableBody").innerHTML = items.map((item) => `
      <tr data-item-id="${item.menuItemId}">
        <td><strong>${HC.escapeHtml(item.name)}</strong><br><span class="muted">${HC.escapeHtml(item.description)}</span></td>
        <td>${HC.escapeHtml(item.category)}</td>
        <td>${HC.formatCurrency(item.price)}</td>
        <td>${(item.cuisines || []).map(HC.escapeHtml).join(", ")}</td>
        <td><span class="badge ${item.isAvailable ? "badge-success" : "badge-danger"}">${item.isAvailable ? "Available" : "Unavailable"}</span></td>
        <td><div class="card-actions"><button class="btn btn-outline" type="button" data-action="edit">Edit</button><button class="btn btn-danger" type="button" data-action="delete" ${item.isAvailable ? "" : "disabled"}>Make unavailable</button></div></td>
      </tr>
    `).join("");
  }

  function openModal(item = null) {
    form.reset();
    document.getElementById("menuFormError").textContent = "";
    document.getElementById("menuModalTitle").textContent = item ? "Edit menu item" : "Add menu item";
    document.getElementById("editMenuId").value = item?.menuItemId || "";
    document.getElementById("itemName").value = item?.name || "";
    document.getElementById("itemCategory").value = item?.category || "";
    document.getElementById("itemPrice").value = item?.price || "";
    document.getElementById("itemPrep").value = item?.preparationMinutes || "";
    document.getElementById("itemDescription").value = item?.description || "";
    document.getElementById("itemAddOns").value = (item?.addOns || [])
      .map((addOn) => `${addOn.name}:${addOn.price}`).join(", ");
    document.getElementById("itemAvailable").checked = item ? Boolean(item.isAvailable) : true;
    [...cuisineSelect.options].forEach((option) => {
      option.selected = (item?.cuisineIds || []).includes(Number(option.value));
    });
    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("itemName").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  async function saveMenuItem(event) {
    event.preventDefault();
    const payload = readForm();
    const error = validate(payload);
    if (error) {
      document.getElementById("menuFormError").textContent = error;
      return;
    }

    const menuItemId = document.getElementById("editMenuId").value;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
    try {
      const response = menuItemId
        ? await apiPut(`/menu-items/${menuItemId}`, payload)
        : await apiPost("/menu-items", payload);
      HC.showToast(response.message || "Menu item saved.");
      closeModal();
      await loadItems();
    } catch (requestError) {
      document.getElementById("menuFormError").textContent =
        requestError.message || "Unable to save the menu item.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Save menu item";
    }
  }

  function readForm() {
    return {
      stallId: Number(stallSelect.value),
      name: document.getElementById("itemName").value.trim(),
      category: document.getElementById("itemCategory").value.trim(),
      price: Number(document.getElementById("itemPrice").value),
      preparationMinutes: Number(document.getElementById("itemPrep").value),
      cuisineIds: [...cuisineSelect.selectedOptions].map((option) => Number(option.value)),
      description: document.getElementById("itemDescription").value.trim(),
      isAvailable: document.getElementById("itemAvailable").checked,
      addOns: parseAddOns(document.getElementById("itemAddOns").value)
    };
  }

  function parseAddOns(value) {
    if (!value.trim()) return [];
    return value.split(",").map((entry) => {
      const separator = entry.lastIndexOf(":");
      return {
        name: entry.slice(0, separator).trim(),
        price: Number(entry.slice(separator + 1).trim())
      };
    }).filter((addOn) => addOn.name && Number.isFinite(addOn.price) && addOn.price >= 0);
  }

  function validate(payload) {
    if (!payload.stallId) return "Select a managed stall.";
    if (payload.name.length < 2) return "Item name must contain at least 2 characters.";
    if (payload.category.length < 2) return "Category must contain at least 2 characters.";
    if (!Number.isFinite(payload.price) || payload.price <= 0) return "Price must be greater than zero.";
    if (!Number.isInteger(payload.preparationMinutes) || payload.preparationMinutes < 1 || payload.preparationMinutes > 240) return "Preparation time must be 1 to 240 minutes.";
    if (payload.description.length < 5) return "Description must contain at least 5 characters.";
    if (!payload.cuisineIds.length) return "Select at least one cuisine.";
    return "";
  }

  async function handleTableAction(event) {
    const button = event.target.closest("[data-action]");
    const menuItemId = Number(event.target.closest("[data-item-id]")?.dataset.itemId);
    if (!button || !menuItemId) return;
    const item = items.find((candidate) => candidate.menuItemId === menuItemId);
    if (button.dataset.action === "edit") {
      openModal(item);
      return;
    }
    if (!window.confirm(`Make ${item.name} unavailable?`)) return;
    try {
      button.disabled = true;
      const response = await apiDelete(`/menu-items/${menuItemId}`);
      HC.showToast(response.message || "Menu item made unavailable.");
      await loadItems();
    } catch (error) {
      setMessage(error.message || "Unable to update the menu item.", "error");
      button.disabled = false;
    }
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.hidden = false;
    message.className = type === "error" ? "notice notice-danger" : "notice";
  }

  function clearMessage() {
    message.hidden = true;
    message.textContent = "";
  }
});
