(function () {
  "use strict";

  // ---- Role guard ----
  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");
  if (role !== "vendor" || !token) {
    window.location.href = "login.html";
    return;
  }

  const CUISINES = [
    { id: "C01", desc: "Chinese" },
    { id: "C02", desc: "Malay" },
    { id: "C03", desc: "Indian" },
    { id: "C04", desc: "Indonesia" },
    { id: "C05", desc: "Japanese" },
    { id: "C06", desc: "Western" }
  ];

  const stallSelect = document.getElementById("stallSelect");
  const menuStatus = document.getElementById("menuStatus");
  const itemList = document.getElementById("itemList");
  const itemFormSection = document.getElementById("itemFormSection");
  const itemForm = document.getElementById("itemForm");
  const formTitle = document.getElementById("formTitle");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const cuisineOptions = document.getElementById("cuisineOptions");

  cuisineOptions.innerHTML = CUISINES.map(
    (c) => `<label><input type="checkbox" value="${c.id}"> ${c.desc}</label>`
  ).join("");

  function showStatus(message, type = "") {
    menuStatus.hidden = false;
    menuStatus.className = type ? `status ${type}` : "status";
    menuStatus.textContent = message;
  }

  function hideStatus() {
    menuStatus.hidden = true;
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  function resetForm() {
    itemForm.reset();
    document.getElementById("editItemCode").value = "";
    formTitle.textContent = "Add a menu item";
    submitBtn.textContent = "Add item";
    cancelEditBtn.hidden = true;
    formError.textContent = "";
  }

  function fillFormForEdit(item) {
    document.getElementById("editItemCode").value = item.ItemCode;
    document.getElementById("itemDesc").value = item.ItemDesc;
    document.getElementById("itemPrice").value = item.ItemPrice;
    document.getElementById("itemCategory").value = item.ItemCategory;

    const selectedIds = (item.Cuisines || "")
      .split(",")
      .map((c) => c.trim());
    cuisineOptions.querySelectorAll("input").forEach((box) => {
      const cuisine = CUISINES.find((c) => c.id === box.value);
      box.checked = cuisine ? selectedIds.includes(cuisine.desc) : false;
    });

    formTitle.textContent = `Edit ${item.ItemDesc}`;
    submitBtn.textContent = "Save changes";
    cancelEditBtn.hidden = false;
    itemFormSection.hidden = false;
    itemFormSection.scrollIntoView({ behavior: "smooth" });
  }

  function createItemCard(item) {
    const card = document.createElement("article");
    card.className = "card card--interactive item-card";
    card.innerHTML = `
      <h3 class="item-title">${item.ItemDesc}</h3>
      <p class="item-meta">${item.ItemCategory}${item.Cuisines ? " · " + item.Cuisines : ""}</p>
      <p class="item-price">$${Number(item.ItemPrice).toFixed(2)}</p>
      <div class="item-actions">
        <button type="button" class="btn secondary edit-btn">Edit</button>
        <button type="button" class="btn danger delete-btn">Delete</button>
      </div>
    `;
    card.querySelector(".edit-btn").addEventListener("click", () => fillFormForEdit(item));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteItem(item.ItemCode, item.ItemDesc));
    return card;
  }

  async function loadStalls() {
    try {
      const res = await fetch("/api/stalls", { headers: { Accept: "application/json" } });
      const stalls = await res.json();
      stallSelect.innerHTML = stalls
        .map((s) => `<option value="${s.StallID}">${s.StallName} (${s.StallID})</option>`)
        .join("");
      if (stalls.length > 0) {
        loadMenu(stallSelect.value);
      }
    } catch (err) {
      console.error("Unable to load stalls:", err);
      showStatus("Unable to load stalls. Please try again later.", "error");
    }
  }

  async function loadMenu(stallId) {
    showStatus("Loading menu items...");
    itemList.innerHTML = "";
    itemFormSection.hidden = false;
    resetForm();

    try {
      const res = await fetch(`/api/stalls/${encodeURIComponent(stallId)}/menu`, {
        headers: { Accept: "application/json" }
      });
      const items = await res.json();

      if (!res.ok) {
        showStatus(items.message || "Unable to load menu items.", "error");
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        showStatus("No menu items yet — add your first one below.");
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((item) => fragment.appendChild(createItemCard(item)));
      itemList.appendChild(fragment);
      hideStatus();
    } catch (err) {
      console.error("Unable to load menu:", err);
      showStatus("Unable to reach the server. Please try again later.", "error");
    }
  }

  async function deleteItem(itemCode, itemDesc) {
    if (!confirm(`Delete "${itemDesc}"? This cannot be undone.`)) {
      return;
    }
    const stallId = stallSelect.value;

    try {
      const res = await fetch(`/api/stalls/${encodeURIComponent(stallId)}/menu/${encodeURIComponent(itemCode)}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to delete this item.");
        return;
      }
      loadMenu(stallId);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Unable to reach the server. Please try again later.");
    }
  }

  itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const stallId = stallSelect.value;
    const editItemCode = document.getElementById("editItemCode").value;
    const itemDesc = document.getElementById("itemDesc").value.trim();
    const itemPrice = Number(document.getElementById("itemPrice").value);
    const itemCategory = document.getElementById("itemCategory").value;
    const cuisineIds = Array.from(cuisineOptions.querySelectorAll("input:checked")).map((box) => box.value);

    if (!itemDesc || isNaN(itemPrice) || itemPrice < 0) {
      formError.textContent = "Please enter a valid item name and price.";
      return;
    }

    const isEdit = Boolean(editItemCode);
    const url = isEdit
      ? `/api/stalls/${encodeURIComponent(stallId)}/menu/${encodeURIComponent(editItemCode)}`
      : `/api/stalls/${encodeURIComponent(stallId)}/menu`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({ itemDesc, itemPrice, itemCategory, cuisineIds })
      });
      const data = await res.json();

      if (!res.ok) {
        formError.textContent = data.message || "Unable to save this item.";
        return;
      }

      resetForm();
      loadMenu(stallId);
    } catch (err) {
      console.error("Save failed:", err);
      formError.textContent = "Unable to reach the server. Please try again later.";
    }
  });

  cancelEditBtn.addEventListener("click", resetForm);
  stallSelect.addEventListener("change", () => loadMenu(stallSelect.value));

  loadStalls();
})();