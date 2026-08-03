document.addEventListener("DOMContentLoaded", function initialiseMenuManagement() {
  if (!HC.initPage("menu-management", ["vendor"])) return;
  const stallId = HC.getCurrentUser().stallId || "clementi-chicken-rice";
  const modal = document.getElementById("menuModal");
  const form = document.getElementById("menuItemForm");

  function getVendorItems() {
    return HC.getMenuItems().filter((item) => item.stallId === stallId);
  }

  function render() {
    const items = getVendorItems();
    document.getElementById("menuManagementEmpty").hidden = items.length > 0;
    document.getElementById("menuTableBody").innerHTML = items.map((item) => `
      <tr data-item="${item.id}">
        <td><strong>${HC.escapeHtml(item.name)}</strong><br><span class="muted">${HC.escapeHtml(item.description)}</span></td>
        <td>${HC.escapeHtml(item.category)}</td><td>${HC.formatCurrency(item.price)}</td><td>${item.cuisines.map(HC.escapeHtml).join(", ")}</td>
        <td><button class="btn ${item.available ? "btn-secondary" : "btn-muted"} availability-toggle" type="button" data-action="toggle">${item.available ? "Available" : "Unavailable"}</button></td>
        <td><div class="card-actions"><button class="btn btn-outline" type="button" data-action="edit">Edit</button><button class="btn btn-danger" type="button" data-action="delete">Delete</button></div></td>
      </tr>`).join("");
  }

  function openModal(item) {
    form.reset();
    document.getElementById("menuFormError").textContent = "";
    document.getElementById("menuModalTitle").textContent = item ? "Edit menu item" : "Add menu item";
    document.getElementById("editMenuId").value = item?.id || "";
    document.getElementById("itemName").value = item?.name || "";
    document.getElementById("itemCategory").value = item?.category || "";
    document.getElementById("itemPrice").value = item?.price || "";
    document.getElementById("itemPrep").value = item?.prep || "";
    document.getElementById("itemCuisines").value = item?.cuisines.join(", ") || "";
    document.getElementById("itemDescription").value = item?.description || "";
    document.getElementById("itemAddOns").value = item?.addOns.map((addOn) => `${addOn.name}:${addOn.price}`).join(", ") || "";
    document.getElementById("itemAvailable").checked = item ? item.available : true;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("itemName").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  document.getElementById("addMenuItem").addEventListener("click", () => openModal(null));
  document.getElementById("closeMenuModal").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  document.getElementById("menuTableBody").addEventListener("click", function handleTableAction(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const itemId = event.target.closest("[data-item]")?.dataset.item;
    if (!action || !itemId) return;
    const items = HC.getMenuItems();
    const item = items.find((candidate) => candidate.id === itemId);
    if (action === "edit") openModal(item);
    if (action === "toggle") {
      item.available = !item.available;
      HC.saveData(HC.KEYS.menuItems, items);
      HC.showToast(`${item.name} is now ${item.available ? "available" : "unavailable"}.`);
      render();
    }
    if (action === "delete" && window.confirm(`Delete ${item.name}? This cannot be undone in the current demo data.`)) {
      HC.saveData(HC.KEYS.menuItems, items.filter((candidate) => candidate.id !== itemId));
      HC.showToast(`${item.name} deleted.`);
      render();
    }
  });

  form.addEventListener("submit", function saveMenuItem(event) {
    event.preventDefault();
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value.trim();
    const price = Number(document.getElementById("itemPrice").value);
    const prep = Number(document.getElementById("itemPrep").value);
    const cuisines = document.getElementById("itemCuisines").value.split(",").map((value) => value.trim()).filter(Boolean);
    const description = document.getElementById("itemDescription").value.trim();
    const error = document.getElementById("menuFormError");
    if (!name || !category || price <= 0 || prep < 1 || !cuisines.length || description.length < 5) {
      error.textContent = "Complete every required field using a positive price, preparation time and useful description.";
      return;
    }
    const addOnsInput = document.getElementById("itemAddOns").value.trim();
    const addOns = addOnsInput ? addOnsInput.split(",").map((entry) => {
      const [addOnName, addOnPrice] = entry.split(":");
      return { name: addOnName?.trim(), price: Number(addOnPrice) };
    }).filter((addOn) => addOn.name && Number.isFinite(addOn.price) && addOn.price >= 0) : [];

    const items = HC.getMenuItems();
    const editId = document.getElementById("editMenuId").value;
    const existing = items.find((item) => item.id === editId);
    const updatedItem = {
      id: existing?.id || `menu-${Date.now()}`,
      stallId,
      name,
      category,
      price,
      prep,
      cuisines,
      description,
      available: document.getElementById("itemAvailable").checked,
      likes: existing?.likes || 0,
      addOns
    };
    const updatedItems = existing ? items.map((item) => item.id === editId ? updatedItem : item) : [...items, updatedItem];
    HC.saveData(HC.KEYS.menuItems, updatedItems);
    HC.showToast(existing ? "Menu item updated." : "Menu item added.");
    closeModal();
    render();
  });

  render();
});
