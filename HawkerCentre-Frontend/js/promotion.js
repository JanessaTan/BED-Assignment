document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const role = HC.getRole();
  const allowedRoles = role === "vendor" ? ["vendor"] : ["customer", "guest"];
  if (!HC.initPage("promotion", allowedRoles)) return;

  const isVendor = role === "vendor";
  const centreFilter = document.getElementById("promotionCentre");
  const stallFilter = document.getElementById("promotionStall");
  const results = document.getElementById("promotionResults");
  const modal = document.getElementById("promotionModal");
  const form = document.getElementById("promotionForm");
  const message = document.getElementById("promotionMessage");
  let promotions = [];
  let stalls = [];
  let menuItems = [];

  centreFilter.addEventListener("change", loadPromotions);
  stallFilter.addEventListener("change", handleStallChange);
  results.addEventListener("click", handlePromotionAction);
  document.getElementById("addPromotion").addEventListener("click", () => openModal());
  document.getElementById("closePromotionModal").addEventListener("click", closeModal);
  form.addEventListener("submit", savePromotion);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  await loadSetup();

  async function loadSetup() {
    setMessage("Loading promotions from the backend...", "info");
    try {
      if (isVendor) {
        const response = await apiGet("/stalls/mine");
        stalls = response?.data || [];
        centreFilter.closest(".field").hidden = true;
        document.getElementById("addPromotion").hidden = false;
      } else {
        const [centreResponse, stallResponse] = await Promise.all([
          apiGet("/hawker-centres?limit=100"),
          apiGet("/stalls?limit=100")
        ]);
        const centres = centreResponse?.data || [];
        stalls = stallResponse?.data || [];
        centreFilter.insertAdjacentHTML("beforeend", centres.map((centre) =>
          `<option value="${centre.centreId}">${HC.escapeHtml(centre.name)}</option>`
        ).join(""));
      }

      stallFilter.insertAdjacentHTML("beforeend", stalls.map((stall) =>
        `<option value="${stall.stallId}">${HC.escapeHtml(stall.name)}</option>`
      ).join(""));

      if (isVendor && stalls.length) stallFilter.value = String(stalls[0].stallId);
      document.getElementById("addPromotion").disabled = isVendor && stalls.length === 0;
      await handleStallChange();
    } catch (error) {
      setMessage(error.message || "Unable to load promotion information.", "error");
    }
  }

  async function handleStallChange() {
    if (isVendor && stallFilter.value) {
      try {
        const response = await apiGet(`/menu-items?stallId=${stallFilter.value}&limit=100`);
        menuItems = response?.data || [];
      } catch (error) {
        menuItems = [];
        setMessage(error.message || "Unable to load eligible menu items.", "error");
      }
    }
    await loadPromotions();
  }

  async function loadPromotions() {
    const params = new URLSearchParams({ limit: "100" });
    if (centreFilter.value) params.set("centreId", centreFilter.value);
    if (stallFilter.value) params.set("stallId", stallFilter.value);
    try {
      const response = await apiGet(`/promotions?${params}`);
      promotions = response?.data || [];
      render();
      clearMessage();
    } catch (error) {
      promotions = [];
      render();
      setMessage(error.message || "Unable to retrieve promotions.", "error");
    }
  }

  function render() {
    document.getElementById("promotionCount").textContent =
      `${promotions.length} promotion${promotions.length === 1 ? "" : "s"} found`;
    results.innerHTML = promotions.map((promotion) => `
      <article class="card promotion-card ${promotion.currentlyActive ? "" : "expired"}" data-promotion-id="${promotion.promotionId}">
        <span class="badge ${promotion.currentlyActive ? "badge-success" : "badge-neutral"}">${promotion.currentlyActive ? "Active" : "Expired / inactive"}</span>
        <h2>${HC.escapeHtml(promotion.name)}</h2>
        <p>${HC.escapeHtml(promotion.description)}</p>
        <div class="card-meta">
          <span>${HC.escapeHtml(promotion.stallName)}</span>
          <span>${HC.escapeHtml(promotion.centreName)}</span>
          <span>${HC.formatDate(promotion.startDate)} - ${HC.formatDate(promotion.endDate)}</span>
          <span>${promotion.discountType === "Percentage" ? `${promotion.discountValue}% off` : `${HC.formatCurrency(promotion.discountValue)} off`}</span>
        </div>
        ${isVendor ? '<div class="card-actions"><button class="btn btn-outline" type="button" data-action="edit">Edit</button><button class="btn btn-danger" type="button" data-action="delete">Deactivate</button></div>' : ""}
      </article>
    `).join("");
  }

  function openModal(promotion = null) {
    form.reset();
    document.getElementById("promotionFormError").textContent = "";
    document.getElementById("promotionModalTitle").textContent = promotion ? "Edit promotion" : "Add promotion";
    document.getElementById("editPromotionId").value = promotion?.promotionId || "";
    document.getElementById("promotionName").value = promotion?.name || "";
    document.getElementById("discountType").value = promotion?.discountType || "Fixed";
    document.getElementById("discountValue").value = promotion?.discountValue || "";
    document.getElementById("promotionStart").value = dateInputValue(promotion?.startDate);
    document.getElementById("promotionEnd").value = dateInputValue(promotion?.endDate);
    document.getElementById("promotionDescription").value = promotion?.description || "";
    document.getElementById("promotionItems").innerHTML = menuItems.map((item) =>
      `<option value="${item.menuItemId}" ${(promotion?.menuItemIds || []).includes(item.menuItemId) ? "selected" : ""}>${HC.escapeHtml(item.name)}</option>`
    ).join("");
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  async function savePromotion(event) {
    event.preventDefault();
    const payload = {
      stallId: Number(stallFilter.value),
      name: document.getElementById("promotionName").value.trim(),
      description: document.getElementById("promotionDescription").value.trim(),
      discountType: document.getElementById("discountType").value,
      discountValue: Number(document.getElementById("discountValue").value),
      startDate: document.getElementById("promotionStart").value,
      endDate: document.getElementById("promotionEnd").value,
      menuItemIds: [...document.getElementById("promotionItems").selectedOptions]
        .map((option) => Number(option.value))
    };
    const validationError = validate(payload);
    if (validationError) {
      document.getElementById("promotionFormError").textContent = validationError;
      return;
    }

    const promotionId = document.getElementById("editPromotionId").value;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = promotionId
        ? await apiPut(`/promotions/${promotionId}`, payload)
        : await apiPost("/promotions", payload);
      HC.showToast(response.message || "Promotion saved.");
      closeModal();
      await loadPromotions();
    } catch (error) {
      document.getElementById("promotionFormError").textContent =
        error.message || "Unable to save the promotion.";
    } finally {
      submitButton.disabled = false;
    }
  }

  async function handlePromotionAction(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const promotionId = Number(event.target.closest("[data-promotion-id]")?.dataset.promotionId);
    if (!action || !promotionId) return;
    const promotion = promotions.find((candidate) => candidate.promotionId === promotionId);
    if (action === "edit") {
      openModal(promotion);
      return;
    }
    if (!window.confirm(`Deactivate ${promotion.name}?`)) return;
    try {
      await apiDelete(`/promotions/${promotionId}`);
      HC.showToast("Promotion deactivated.");
      await loadPromotions();
    } catch (error) {
      setMessage(error.message || "Unable to deactivate the promotion.", "error");
    }
  }

  function validate(payload) {
    if (!payload.stallId) return "Select a managed stall.";
    if (payload.name.length < 2) return "Promotion name must contain at least 2 characters.";
    if (payload.description.length < 5) return "Description must contain at least 5 characters.";
    if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) return "Discount must be greater than zero.";
    if (payload.discountType === "Percentage" && payload.discountValue > 100) return "Percentage discount cannot exceed 100%.";
    if (!payload.startDate || !payload.endDate) return "Enter both promotion dates.";
    if (payload.endDate < payload.startDate) return "End date cannot be before start date.";
    return "";
  }

  function dateInputValue(value) {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 10);
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
