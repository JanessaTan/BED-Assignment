document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("cuisine-management", ["administrator"])) return;

  const form = document.getElementById("cuisineForm");
  const nameInput = document.getElementById("cuisineName");
  const errorElement = document.getElementById("cuisineFormError");
  const message = document.getElementById("cuisineMessage");
  const tableBody = document.getElementById("cuisineTableBody");
  let cuisines = [];

  form.addEventListener("submit", createCuisine);
  tableBody.addEventListener("click", handleAction);
  await loadCuisines();

  async function loadCuisines() {
    try {
      const response = await apiGet("/cuisines");
      cuisines = response?.data || [];
      tableBody.innerHTML = cuisines.map((cuisine) => `
        <tr data-cuisine-id="${cuisine.cuisineId}">
          <td>${cuisine.cuisineId}</td>
          <td><strong>${HC.escapeHtml(cuisine.name)}</strong></td>
          <td><div class="card-actions"><button class="btn btn-outline" type="button" data-action="edit">Rename</button><button class="btn btn-danger" type="button" data-action="delete">Delete</button></div></td>
        </tr>
      `).join("");
      clearMessage();
    } catch (error) {
      setMessage(error.message || "Unable to load cuisines.", "error");
    }
  }

  async function createCuisine(event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    errorElement.textContent = validateName(name);
    if (errorElement.textContent) return;
    try {
      const response = await apiPost("/cuisines", { name });
      HC.showToast(response.message || "Cuisine created.");
      form.reset();
      await loadCuisines();
    } catch (error) {
      errorElement.textContent = error.message || "Unable to create the cuisine.";
    }
  }

  async function handleAction(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const cuisineId = Number(event.target.closest("[data-cuisine-id]")?.dataset.cuisineId);
    if (!action || !cuisineId) return;
    const cuisine = cuisines.find((candidate) => candidate.cuisineId === cuisineId);

    if (action === "edit") {
      const name = window.prompt("Enter the new cuisine name:", cuisine.name)?.trim();
      if (name == null) return;
      const validationError = validateName(name);
      if (validationError) {
        setMessage(validationError, "error");
        return;
      }
      try {
        await apiPut(`/cuisines/${cuisineId}`, { name });
        HC.showToast("Cuisine updated.");
        await loadCuisines();
      } catch (error) {
        setMessage(error.message || "Unable to update the cuisine.", "error");
      }
      return;
    }

    if (!window.confirm(`Delete ${cuisine.name}? This is blocked when related records exist.`)) return;
    try {
      await apiDelete(`/cuisines/${cuisineId}`);
      HC.showToast("Cuisine deleted.");
      await loadCuisines();
    } catch (error) {
      setMessage(error.message || "Unable to delete the cuisine.", "error");
    }
  }

  function validateName(name) {
    return name.length >= 2 && name.length <= 80
      ? ""
      : "Cuisine name must contain 2 to 80 characters.";
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
