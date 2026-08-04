document.addEventListener(
  "DOMContentLoaded",
  async function initialisePromotionManagement() {
    "use strict";

    if (!HC.initPage("promotion-management", ["vendor"])) return;

    const stallSelect = document.getElementById("promotionStall");
    const addPromotionButton = document.getElementById("addPromotion");
    const statusBox = document.getElementById("promotionPageStatus");
    const tableWrap = document.getElementById("promotionTableWrap");
    const tableBody = document.getElementById("promotionTableBody");
    const emptyState = document.getElementById("promotionManagementEmpty");
    const countTarget = document.getElementById("promotionCount");
    const countLabel = document.getElementById("promotionCountLabel");

    const modal = document.getElementById("promotionModal");
    const modalTitle = document.getElementById("promotionModalTitle");
    const closeModalButton = document.getElementById("closePromotionModal");
    const form = document.getElementById("promotionForm");
    const formError = document.getElementById("promotionFormError");
    const saveButton = document.getElementById("savePromotionButton");

    const editIdInput = document.getElementById("editPromotionId");
    const nameInput = document.getElementById("promotionName");
    const descriptionInput = document.getElementById(
      "promotionDescription"
    );
    const discountTypeInput = document.getElementById("discountType");
    const discountValueInput = document.getElementById("discountValue");
    const discountValueLabel = document.getElementById(
      "discountValueLabel"
    );
    const startDateInput = document.getElementById(
      "promotionStartDate"
    );
    const endDateInput = document.getElementById("promotionEndDate");
    const menuItemsInput = document.getElementById(
      "promotionMenuItems"
    );

    let stalls = [];
    let promotions = [];
    let menuItems = [];
    let selectedStallId = null;

    addPromotionButton.addEventListener("click", function () {
      openModal(null);
    });

    closeModalButton.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    stallSelect.addEventListener("change", async function () {
      const nextStallId = Number(stallSelect.value);

      if (!Number.isInteger(nextStallId) || nextStallId < 1) {
        return;
      }

      selectedStallId = nextStallId;
      await loadSelectedStall();
    });

    discountTypeInput.addEventListener(
      "change",
      updateDiscountInput
    );

    tableBody.addEventListener("click", handleTableAction);
    form.addEventListener("submit", savePromotion);

    try {
      await loadVendorStalls();
    } catch (error) {
      console.error("Promotion management failed to load:", error);
      showPageError(
        error.message || "Unable to load promotion management data."
      );
    }

    async function loadVendorStalls() {
      setPageStatus("Loading your managed stalls...");

      const response = await apiGet("/stalls/mine");
      stalls = Array.isArray(response?.data) ? response.data : [];

      if (stalls.length === 0) {
        stallSelect.innerHTML =
          '<option value="">No managed stalls</option>';
        stallSelect.disabled = true;
        addPromotionButton.disabled = true;
        tableWrap.hidden = true;
        emptyState.hidden = false;
        emptyState.querySelector("h2").textContent =
          "No managed stall";
        emptyState.querySelector("p").textContent =
          "Create or assign a stall before managing promotions.";
        setPageStatus(
          "This Vendor account is not linked to an active stall."
        );
        return;
      }

      stallSelect.innerHTML = stalls
        .map(function (stall) {
          return `
            <option value="${Number(stall.stallId)}">
              ${HC.escapeHtml(stall.name)}
              ${stall.unitNumber
                ? ` (${HC.escapeHtml(stall.unitNumber)})`
                : ""}
            </option>
          `;
        })
        .join("");

      stallSelect.disabled = stalls.length === 1;
      selectedStallId = Number(stalls[0].stallId);
      stallSelect.value = String(selectedStallId);
      addPromotionButton.disabled = false;

      await loadSelectedStall();
    }

    async function loadSelectedStall() {
      if (
        !Number.isInteger(selectedStallId) ||
        selectedStallId < 1
      ) {
        throw new Error("A valid Vendor stall was not selected.");
      }

      setPageStatus("Loading promotions and menu items...");
      addPromotionButton.disabled = true;

      try {
        const [promotionResponse, menuResponse] =
          await Promise.all([
            apiGet(
              `/promotions?stallId=${encodeURIComponent(
                selectedStallId
              )}&limit=100`
            ),
            apiGet(
              `/menu-items?stallId=${encodeURIComponent(
                selectedStallId
              )}&limit=100`
            )
          ]);

        promotions = Array.isArray(promotionResponse?.data)
          ? promotionResponse.data
          : [];

        menuItems = Array.isArray(menuResponse?.data)
          ? menuResponse.data
          : [];

        renderMenuItemOptions([]);
        renderPromotions();
        setPageStatus("");
      } catch (error) {
        console.error("Selected stall data failed to load:", error);
        showPageError(
          error.message ||
            "Unable to load promotions for the selected stall."
        );
      } finally {
        addPromotionButton.disabled = false;
      }
    }

    function renderPromotions() {
      countTarget.textContent = String(promotions.length);
      countLabel.textContent =
        promotions.length === 1 ? "promotion" : "promotions";

      if (promotions.length === 0) {
        tableWrap.hidden = true;
        emptyState.hidden = false;
        emptyState.querySelector("h2").textContent =
          "No promotions";
        emptyState.querySelector("p").textContent =
          "Create the stall's first promotion.";
        tableBody.innerHTML = "";
        return;
      }

      emptyState.hidden = true;
      tableWrap.hidden = false;

      tableBody.innerHTML = promotions
        .map(function (promotion) {
          const status = getPromotionStatus(promotion);
          const linkedItems = resolveLinkedMenuNames(promotion);

          return `
            <tr>
              <td>
                <p class="promotion-name">
                  ${HC.escapeHtml(promotion.name)}
                </p>
                <p class="promotion-description">
                  ${HC.escapeHtml(promotion.description)}
                </p>
              </td>

              <td>
                ${formatDiscount(promotion)}
              </td>

              <td>
                ${HC.escapeHtml(linkedItems)}
              </td>

              <td>
                ${HC.escapeHtml(formatDate(promotion.startDate))}
                <br>
                to
                <br>
                ${HC.escapeHtml(formatDate(promotion.endDate))}
              </td>

              <td>
                <span class="status-badge ${status.className}">
                  ${status.label}
                </span>
              </td>

              <td>
                <div class="promotion-actions">
                  <button
                    class="btn btn-muted"
                    type="button"
                    data-action="edit"
                    data-promotion-id="${Number(
                      promotion.promotionId
                    )}">
                    Edit
                  </button>

                  <button
                    class="btn btn-danger"
                    type="button"
                    data-action="delete"
                    data-promotion-id="${Number(
                      promotion.promotionId
                    )}"
                    ${Boolean(promotion.isActive) ? "" : "disabled"}>
                    Deactivate
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    async function handleTableAction(event) {
      const button = event.target.closest(
        "button[data-promotion-id]"
      );

      if (!button) return;

      const promotionId = Number(button.dataset.promotionId);
      const promotion = promotions.find(function (item) {
        return Number(item.promotionId) === promotionId;
      });

      if (!promotion) {
        HC.showToast("Promotion could not be found.");
        return;
      }

      const action = button.dataset.action;

      if (action === "edit") {
        openModal(promotion);
        return;
      }

      if (
        action === "delete" &&
        window.confirm(
          `Deactivate "${promotion.name}"? Customers will no longer see it as an active promotion.`
        )
      ) {
        button.disabled = true;

        try {
          const response = await apiDelete(
            `/promotions/${promotionId}`
          );

          HC.showToast(
            response?.message || "Promotion deactivated."
          );

          await loadSelectedStall();
        } catch (error) {
          console.error("Promotion deactivation failed:", error);
          HC.showToast(
            error.message || "Unable to deactivate the promotion."
          );
        } finally {
          button.disabled = false;
        }
      }
    }

    function openModal(promotion) {
      form.reset();
      formError.textContent = "";
      editIdInput.value = "";
      modalTitle.textContent = "Add promotion";

      discountTypeInput.value = "Percentage";
      discountValueInput.value = "";
      startDateInput.value = getTodayForInput();
      endDateInput.value = getTodayForInput();

      let linkedIds = [];

      if (promotion) {
        modalTitle.textContent = "Edit promotion";
        editIdInput.value = String(promotion.promotionId);
        nameInput.value = promotion.name || "";
        descriptionInput.value = promotion.description || "";
        discountTypeInput.value =
          promotion.discountType || "Percentage";
        discountValueInput.value = Number(
          promotion.discountValue
        );
        startDateInput.value = toDateInput(
          promotion.startDate
        );
        endDateInput.value = toDateInput(promotion.endDate);
        linkedIds = normaliseIds(promotion.menuItemIds);
      }

      updateDiscountInput();
      renderMenuItemOptions(linkedIds);
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      nameInput.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      formError.textContent = "";
      setSaving(false);
    }

    async function savePromotion(event) {
      event.preventDefault();
      formError.textContent = "";

      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();
      const discountType = discountTypeInput.value;
      const discountValue = Number(discountValueInput.value);
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      const menuItemIds = Array.from(
        menuItemsInput.selectedOptions
      ).map(function (option) {
        return Number(option.value);
      });

      if (name.length < 2 || name.length > 150) {
        formError.textContent =
          "Promotion name must contain 2 to 150 characters.";
        return;
      }

      if (
        description.length < 5 ||
        description.length > 500
      ) {
        formError.textContent =
          "Description must contain 5 to 500 characters.";
        return;
      }

      if (!["Percentage", "Fixed"].includes(discountType)) {
        formError.textContent = "Select a valid discount type.";
        return;
      }

      if (
        !Number.isFinite(discountValue) ||
        discountValue <= 0
      ) {
        formError.textContent =
          "Discount value must be greater than zero.";
        return;
      }

      if (
        discountType === "Percentage" &&
        discountValue > 100
      ) {
        formError.textContent =
          "Percentage discount cannot exceed 100.";
        return;
      }

      if (!startDate || !endDate) {
        formError.textContent =
          "Select both the start date and end date.";
        return;
      }

      if (endDate < startDate) {
        formError.textContent =
          "End date cannot be before start date.";
        return;
      }

      const payload = {
        stallId: selectedStallId,
        name,
        description,
        discountType,
        discountValue,
        startDate,
        endDate,
        menuItemIds
      };

      const promotionId = Number(editIdInput.value);

      try {
        setSaving(true);

        const response =
          Number.isInteger(promotionId) && promotionId > 0
            ? await apiPut(
                `/promotions/${promotionId}`,
                payload
              )
            : await apiPost("/promotions", payload);

        HC.showToast(
          response?.message ||
            (promotionId
              ? "Promotion updated."
              : "Promotion created.")
        );

        closeModal();
        await loadSelectedStall();
      } catch (error) {
        console.error("Promotion save failed:", error);

        const firstValidationError =
          Array.isArray(error.errors) &&
          error.errors.length > 0
            ? error.errors[0]?.message
            : "";

        formError.textContent =
          firstValidationError ||
          error.message ||
          "Unable to save the promotion.";
      } finally {
        setSaving(false);
      }
    }

    function renderMenuItemOptions(selectedIds) {
      const selectedSet = new Set(
        normaliseIds(selectedIds)
      );

      if (menuItems.length === 0) {
        menuItemsInput.innerHTML =
          '<option value="" disabled>No menu items available</option>';
        menuItemsInput.disabled = true;
        return;
      }

      menuItemsInput.disabled = false;
      menuItemsInput.innerHTML = menuItems
        .map(function (item) {
          const itemId = Number(item.menuItemId);
          return `
            <option
              value="${itemId}"
              ${selectedSet.has(itemId) ? "selected" : ""}>
              ${HC.escapeHtml(item.name)} — ${HC.escapeHtml(
                HC.formatCurrency(Number(item.price))
              )}
            </option>
          `;
        })
        .join("");
    }

    function updateDiscountInput() {
      const percentage =
        discountTypeInput.value === "Percentage";

      discountValueLabel.textContent = percentage
        ? "Discount value (%)"
        : "Discount value (S$)";

      discountValueInput.max = percentage ? "100" : "10000";
      discountValueInput.step = "0.01";
    }

    function resolveLinkedMenuNames(promotion) {
      const linkedIds = normaliseIds(
        promotion.menuItemIds
      );

      if (linkedIds.length === 0) {
        return "Entire stall";
      }

      const names = linkedIds
        .map(function (itemId) {
          return menuItems.find(function (item) {
            return Number(item.menuItemId) === itemId;
          })?.name;
        })
        .filter(Boolean);

      return names.length > 0
        ? names.join(", ")
        : `${linkedIds.length} selected menu item${
            linkedIds.length === 1 ? "" : "s"
          }`;
    }

    function normaliseIds(value) {
      if (Array.isArray(value)) {
        return [
          ...new Set(
            value
              .map(Number)
              .filter(function (id) {
                return Number.isInteger(id) && id > 0;
              })
          )
        ];
      }

      if (typeof value === "string" && value.trim()) {
        return [
          ...new Set(
            value
              .split(/[|,]/)
              .map(Number)
              .filter(function (id) {
                return Number.isInteger(id) && id > 0;
              })
          )
        ];
      }

      return [];
    }

    function formatDiscount(promotion) {
      const value = Number(promotion.discountValue);

      if (promotion.discountType === "Percentage") {
        return `${value}%`;
      }

      return HC.formatCurrency(value);
    }

    function getPromotionStatus(promotion) {
      if (!Boolean(promotion.isActive)) {
        return {
          label: "Inactive",
          className: "status-inactive"
        };
      }

      const today = getTodayForInput();
      const startDate = toDateInput(promotion.startDate);
      const endDate = toDateInput(promotion.endDate);

      if (today < startDate) {
        return {
          label: "Upcoming",
          className: "status-upcoming"
        };
      }

      if (today > endDate) {
        return {
          label: "Expired",
          className: "status-expired"
        };
      }

      return {
        label: "Active",
        className: "status-active"
      };
    }

    function toDateInput(value) {
      if (!value) return "";
      return String(value).slice(0, 10);
    }

    function formatDate(value) {
      const dateValue = toDateInput(value);
      if (!dateValue) return "Not set";

      const date = new Date(`${dateValue}T00:00:00`);
      return new Intl.DateTimeFormat("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(date);
    }

    function getTodayForInput() {
      const today = new Date();
      const local = new Date(
        today.getTime() -
          today.getTimezoneOffset() * 60_000
      );

      return local.toISOString().slice(0, 10);
    }

    function setPageStatus(message) {
      statusBox.classList.remove("is-error");

      if (!message) {
        statusBox.hidden = true;
        statusBox.textContent = "";
        return;
      }

      statusBox.hidden = false;
      statusBox.textContent = message;
    }

    function showPageError(message) {
      statusBox.hidden = false;
      statusBox.classList.add("is-error");
      statusBox.textContent = message;
      tableWrap.hidden = true;
    }

    function setSaving(saving) {
      saveButton.disabled = saving;
      saveButton.textContent = saving
        ? "Saving..."
        : "Save promotion";
    }
  }
);
