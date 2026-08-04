document.addEventListener(
  "DOMContentLoaded",
  async function initialiseStallManagement() {
    "use strict";

    if (!HC.initPage("stall-management", ["vendor"])) {
      return;
    }

    const stallList = document.getElementById("stallList");
    const stallMessage = document.getElementById("stallMessage");
    const stallEditorCard =
      document.getElementById("stallEditorCard");

    const stallForm = document.getElementById("stallForm");
    const refreshButton =
      document.getElementById("refreshStalls");
    const cancelButton =
      document.getElementById("cancelEditButton");
    const saveButton =
      document.getElementById("saveStallButton");

    const stallIdInput = document.getElementById("stallId");
    const stallNameInput =
      document.getElementById("stallName");
    const unitNumberInput =
      document.getElementById("unitNumber");
    const centreNameInput =
      document.getElementById("centreName");
    const openingHoursInput =
      document.getElementById("openingHours");
    const descriptionInput =
      document.getElementById("stallDescription");
    const isActiveInput =
      document.getElementById("isActive");

    const stallNameError =
      document.getElementById("stallNameError");
    const unitNumberError =
      document.getElementById("unitNumberError");
    const openingHoursError =
      document.getElementById("openingHoursError");
    const descriptionError =
      document.getElementById("descriptionError");

    let ownedStalls = [];
    let selectedStall = null;

    function showMessage(message, type = "info") {
      stallMessage.hidden = false;
      stallMessage.textContent = message;

      if (type === "error") {
        stallMessage.className = "notice notice-danger";
        return;
      }

      if (type === "success") {
        stallMessage.className = "notice notice-info text-success";
        return;
      }

      stallMessage.className = "notice notice-info";
    }

    function clearErrors() {
      stallNameError.textContent = "";
      unitNumberError.textContent = "";
      openingHoursError.textContent = "";
      descriptionError.textContent = "";
    }

    function getStallId(stall) {
      return Number(
        stall?.stallId ??
        stall?.stall_id ??
        stall?.id
      );
    }

    function getCentreId(stall) {
      const value =
        stall?.centreId ??
        stall?.centre_id ??
        null;

      if (value === null || value === undefined) {
        return null;
      }

      const numberValue = Number(value);

      return Number.isFinite(numberValue)
        ? numberValue
        : value;
    }

    function getStallName(stall) {
      return String(
        stall?.name ??
        stall?.stallName ??
        stall?.stall_name ??
        ""
      );
    }

    function getUnitNumber(stall) {
      return String(
        stall?.unitNumber ??
        stall?.unit_number ??
        ""
      );
    }

    function getCentreName(stall) {
      return String(
        stall?.centreName ??
        stall?.centre_name ??
        ""
      );
    }

    function getDescription(stall) {
      return String(stall?.description ?? "");
    }

    function getOpeningHours(stall) {
      return String(
        stall?.openingHours ??
        stall?.opening_hours ??
        ""
      );
    }

    function getIsActive(stall) {
      const value =
        stall?.isActive ??
        stall?.is_active;

      return (
        value === true ||
        value === 1 ||
        value === "1"
      );
    }

    function normaliseStallResponse(response) {
      if (Array.isArray(response)) {
        return response;
      }

      if (Array.isArray(response?.stalls)) {
        return response.stalls;
      }

      if (Array.isArray(response?.data)) {
        return response.data;
      }

      if (Array.isArray(response?.data?.stalls)) {
        return response.data.stalls;
      }

      if (response?.stall) {
        return [response.stall];
      }

      if (response?.data?.stall) {
        return [response.data.stall];
      }

      return [];
    }

    function renderStallList() {
      if (ownedStalls.length === 0) {
        stallList.innerHTML = `
          <div class="empty-state">
            <h3>No assigned stall</h3>
            <p>
              This Vendor account is not currently connected
              to a stall.
            </p>
          </div>
        `;

        stallEditorCard.hidden = true;
        return;
      }

      stallList.innerHTML = ownedStalls.map((stall) => {
        const stallId = getStallId(stall);
        const stallName = getStallName(stall);
        const unitNumber = getUnitNumber(stall);
        const centreName = getCentreName(stall);
        const active = getIsActive(stall);
        const selected =
          getStallId(selectedStall) === stallId;

        return `
          <article
            class="stall-record${selected ? " is-selected" : ""}"
          >
            <div class="row-between">
              <h3>${HC.escapeHtml(stallName)}</h3>

              <span class="badge ${
                active ? "badge-success" : "badge-neutral"
              }">
                ${active ? "Active" : "Inactive"}
              </span>
            </div>

            <p>
              ${HC.escapeHtml(unitNumber || "No unit number")}
            </p>

            <p class="muted">
              ${HC.escapeHtml(
                centreName || "Centre information unavailable"
              )}
            </p>

            <div class="stall-record-meta">
              <span class="badge badge-info">
                Stall ID ${HC.escapeHtml(String(stallId))}
              </span>
            </div>

            <div class="card-actions">
              <button
                class="btn btn-outline"
                type="button"
                data-edit-stall="${stallId}"
              >
                Edit details
              </button>
            </div>
          </article>
        `;
      }).join("");
    }

    function fillForm(stall) {
      selectedStall = stall;

      stallIdInput.value = getStallId(stall);
      stallNameInput.value = getStallName(stall);
      unitNumberInput.value = getUnitNumber(stall);
      centreNameInput.value = getCentreName(stall);
      openingHoursInput.value = getOpeningHours(stall);
      descriptionInput.value = getDescription(stall);
      isActiveInput.checked = getIsActive(stall);

      clearErrors();
      stallEditorCard.hidden = false;
      renderStallList();
    }

    function validateForm() {
      clearErrors();

      const name = stallNameInput.value.trim();
      const unitNumber = unitNumberInput.value.trim();
      const openingHours =
        openingHoursInput.value.trim();
      const description =
        descriptionInput.value.trim();

      let valid = true;

      if (name.length < 2) {
        stallNameError.textContent =
          "Enter a stall name with at least 2 characters.";
        valid = false;
      }

      if (!unitNumber) {
        unitNumberError.textContent =
          "Enter the stall unit number.";
        valid = false;
      }

      if (!openingHours) {
        openingHoursError.textContent =
          "Enter the stall opening hours.";
        valid = false;
      }

      if (description.length < 10) {
        descriptionError.textContent =
          "Enter a useful description with at least 10 characters.";
        valid = false;
      }

      return valid;
    }

    async function loadOwnedStalls() {
      showMessage("Loading your assigned stalls...");

      stallList.innerHTML = "";
      stallEditorCard.hidden = true;
      selectedStall = null;

      try {
        const response = await apiGet("/stalls/mine");

        ownedStalls = normaliseStallResponse(response);

        renderStallList();

        if (ownedStalls.length === 0) {
          showMessage(
            "No stall is currently assigned to this Vendor account.",
            "error"
          );
          return;
        }

        fillForm(ownedStalls[0]);

        showMessage(
          `${ownedStalls.length} assigned stall${
            ownedStalls.length === 1 ? "" : "s"
          } loaded successfully.`,
          "success"
        );
      } catch (error) {
        console.error(
          "Unable to load Vendor stalls:",
          error
        );

        ownedStalls = [];
        renderStallList();

        showMessage(
          error.message ||
          "Unable to load your assigned stalls.",
          "error"
        );
      }
    }

    stallList.addEventListener(
      "click",
      function handleStallSelection(event) {
        const editButton =
          event.target.closest("[data-edit-stall]");

        if (!editButton) {
          return;
        }

        const stallId = Number(
          editButton.dataset.editStall
        );

        const stall = ownedStalls.find(
          (item) => getStallId(item) === stallId
        );

        if (stall) {
          fillForm(stall);

          stallEditorCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    );

    stallForm.addEventListener(
      "submit",
      async function updateStall(event) {
        event.preventDefault();

        if (!selectedStall || !validateForm()) {
          return;
        }

        const stallId = getStallId(selectedStall);

        if (
          !Number.isInteger(stallId) ||
          stallId <= 0
        ) {
          showMessage(
            "A valid stall could not be identified.",
            "error"
          );
          return;
        }

        const payload = {
          centreId: getCentreId(selectedStall),
          name: stallNameInput.value.trim(),
          unitNumber: unitNumberInput.value.trim(),
          description:
            descriptionInput.value.trim(),
          openingHours:
            openingHoursInput.value.trim(),
          isActive: isActiveInput.checked
        };

        if (
          payload.centreId === null ||
          payload.centreId === undefined
        ) {
          delete payload.centreId;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
          const response = await apiPut(
            `/stalls/${stallId}`,
            payload
          );

          showMessage(
            response?.message ||
            "Stall details updated successfully.",
            "success"
          );

          await loadOwnedStalls();
        } catch (error) {
          console.error(
            "Unable to update stall:",
            error
          );

          showMessage(
            error.message ||
            "Unable to update the stall.",
            "error"
          );
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = "Save changes";
        }
      }
    );

    cancelButton.addEventListener(
      "click",
      function resetStallForm() {
        if (selectedStall) {
          fillForm(selectedStall);
        }
      }
    );

    refreshButton.addEventListener(
      "click",
      loadOwnedStalls
    );

    await loadOwnedStalls();
  }
);