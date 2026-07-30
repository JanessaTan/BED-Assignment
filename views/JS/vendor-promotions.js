(function () {
  "use strict";

  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");
  if (role !== "vendor" || !token) {
    window.location.href = "login.html";
    return;
  }

  const stallSelect = document.getElementById("stallSelect");
  const promoStatus = document.getElementById("promoStatus");
  const promoList = document.getElementById("promoList");
  const promoFormSection = document.getElementById("promoFormSection");
  const promoForm = document.getElementById("promoForm");
  const formTitle = document.getElementById("formTitle");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  function showStatus(message, type = "") {
    promoStatus.hidden = false;
    promoStatus.className = type ? `status ${type}` : "status";
    promoStatus.textContent = message;
  }

  function hideStatus() {
    promoStatus.hidden = true;
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  function toDateInputValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function resetForm() {
    promoForm.reset();
    document.getElementById("editPromoId").value = "";
    formTitle.textContent = "Add a promotion";
    submitBtn.textContent = "Add promotion";
    cancelEditBtn.hidden = true;
    formError.textContent = "";
  }

  function fillFormForEdit(promo) {
    document.getElementById("editPromoId").value = promo.PromoID;
    document.getElementById("promoDesc").value = promo.PromoDesc;
    document.getElementById("promoStartDate").value = toDateInputValue(promo.PromoStartDate);
    document.getElementById("promoEndDate").value = toDateInputValue(promo.PromoEndDate);

    formTitle.textContent = "Edit promotion";
    submitBtn.textContent = "Save changes";
    cancelEditBtn.hidden = false;
    promoFormSection.hidden = false;
    promoFormSection.scrollIntoView({ behavior: "smooth" });
  }

  function createPromoCard(promo) {
    const card = document.createElement("article");
    card.className = "card card--interactive promo-card";
    card.innerHTML = `
      <h3 class="promo-desc">${promo.PromoDesc}</h3>
      <p class="promo-dates">${formatDate(promo.PromoStartDate)} – ${formatDate(promo.PromoEndDate)}</p>
      <div class="promo-actions">
        <button type="button" class="btn secondary edit-btn">Edit</button>
        <button type="button" class="btn danger delete-btn">Delete</button>
      </div>
    `;
    card.querySelector(".edit-btn").addEventListener("click", () => fillFormForEdit(promo));
    card.querySelector(".delete-btn").addEventListener("click", () => deletePromo(promo.PromoID, promo.PromoDesc));
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
        loadPromotions(stallSelect.value);
      }
    } catch (err) {
      console.error("Unable to load stalls:", err);
      showStatus("Unable to load stalls. Please try again later.", "error");
    }
  }

  async function loadPromotions(stallId) {
    showStatus("Loading promotions...");
    promoList.innerHTML = "";
    promoFormSection.hidden = false;
    resetForm();

    try {
      const res = await fetch(`/api/stalls/${encodeURIComponent(stallId)}/promotions`, {
        headers: { Accept: "application/json" }
      });
      const promotions = await res.json();

      if (!res.ok) {
        showStatus(promotions.message || "Unable to load promotions.", "error");
        return;
      }
      if (!Array.isArray(promotions) || promotions.length === 0) {
        showStatus("No promotions yet — add your first one below.");
        return;
      }

      const fragment = document.createDocumentFragment();
      promotions.forEach((promo) => fragment.appendChild(createPromoCard(promo)));
      promoList.appendChild(fragment);
      hideStatus();
    } catch (err) {
      console.error("Unable to load promotions:", err);
      showStatus("Unable to reach the server. Please try again later.", "error");
    }
  }

  async function deletePromo(promoId, promoDesc) {
    if (!confirm(`Delete "${promoDesc}"? This cannot be undone.`)) {
      return;
    }
    const stallId = stallSelect.value;

    try {
      const res = await fetch(`/api/stalls/${encodeURIComponent(stallId)}/promotions/${encodeURIComponent(promoId)}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to delete this promotion.");
        return;
      }
      loadPromotions(stallId);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Unable to reach the server. Please try again later.");
    }
  }

  promoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const stallId = stallSelect.value;
    const editPromoId = document.getElementById("editPromoId").value;
    const promoDesc = document.getElementById("promoDesc").value.trim();
    const promoStartDate = document.getElementById("promoStartDate").value;
    const promoEndDate = document.getElementById("promoEndDate").value;

    if (!promoDesc || !promoStartDate || !promoEndDate) {
      formError.textContent = "Please fill in all fields.";
      return;
    }
    if (new Date(promoEndDate) <= new Date(promoStartDate)) {
      formError.textContent = "End date must be after start date.";
      return;
    }

    const isEdit = Boolean(editPromoId);
    const url = isEdit
      ? `/api/stalls/${encodeURIComponent(stallId)}/promotions/${encodeURIComponent(editPromoId)}`
      : `/api/stalls/${encodeURIComponent(stallId)}/promotions`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({ promoDesc, promoStartDate, promoEndDate })
      });
      const data = await res.json();

      if (!res.ok) {
        formError.textContent = data.message || "Unable to save this promotion.";
        return;
      }

      resetForm();
      loadPromotions(stallId);
    } catch (err) {
      console.error("Save failed:", err);
      formError.textContent = "Unable to reach the server. Please try again later.";
    }
  });

  cancelEditBtn.addEventListener("click", resetForm);
  stallSelect.addEventListener("change", () => loadPromotions(stallSelect.value));

  loadStalls();
})();