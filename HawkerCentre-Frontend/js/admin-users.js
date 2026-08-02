document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("admin-users", ["administrator"])) return;

  const tableBody = document.getElementById("usersTableBody");
  const createForm = document.getElementById("createUserForm");
  const editForm = document.getElementById("editUserForm");
  const dialog = document.getElementById("editUserDialog");
  let users = [];
  let currentPage = 1;
  const limit = 10;
  let total = 0;

  createForm.addEventListener("submit", createUser);
  editForm.addEventListener("submit", updateUser);
  document.getElementById("searchUsersForm").addEventListener("submit", searchUsers);
  document.getElementById("previousPageButton").addEventListener("click", () => changePage(-1));
  document.getElementById("nextPageButton").addEventListener("click", () => changePage(1));
  document.getElementById("cancelEditButton").addEventListener("click", () => dialog.close());
  tableBody.addEventListener("click", handleAction);

  await loadUsers();

  async function loadUsers() {
    setMessage("listMessage", "Loading user accounts...", "info");
    const params = new URLSearchParams({ page: String(currentPage), limit: String(limit) });
    const search = document.getElementById("userSearch").value.trim();
    const role = document.getElementById("roleFilter").value;
    if (search) params.set("search", search);
    if (role) params.set("role", role);

    try {
      const response = await apiGet(`/users?${params}`);
      users = response?.data || [];
      total = Number(response?.meta?.total) || 0;
      renderUsers();
      clearMessage("listMessage");
    } catch (error) {
      users = [];
      total = 0;
      renderUsers();
      setMessage("listMessage", error.message || "Unable to retrieve users.", "error");
    }
  }

  function renderUsers() {
    tableBody.innerHTML = users.length ? users.map((user) => `
      <tr data-user-id="${user.userId}">
        <td>${user.userId}</td>
        <td>${HC.escapeHtml(user.fullName)}</td>
        <td>${HC.escapeHtml(user.email)}</td>
        <td>${HC.escapeHtml(user.roleName)}</td>
        <td><span class="badge ${user.accountStatus === "Active" ? "badge-success" : "badge-warning"}">${HC.escapeHtml(user.accountStatus)}</span></td>
        <td>${HC.escapeHtml(user.phone || "—")}</td>
        <td><div class="card-actions"><button class="btn btn-outline" type="button" data-action="edit">Edit</button><button class="btn btn-secondary" type="button" data-action="status">Change status</button><button class="btn btn-danger" type="button" data-action="delete">Deactivate</button></div></td>
      </tr>
    `).join("") : '<tr><td colspan="7">No users found.</td></tr>';

    const first = total ? (currentPage - 1) * limit + 1 : 0;
    const last = Math.min(currentPage * limit, total);
    document.getElementById("pageSummary").textContent = `Showing ${first}-${last} of ${total}`;
    document.getElementById("previousPageButton").disabled = currentPage <= 1;
    document.getElementById("nextPageButton").disabled = last >= total;
  }

  async function createUser(event) {
    event.preventDefault();
    const payload = {
      fullName: document.getElementById("createFullName").value.trim(),
      email: document.getElementById("createEmail").value.trim().toLowerCase(),
      phone: document.getElementById("createPhone").value.trim(),
      password: document.getElementById("createPassword").value,
      role: document.getElementById("createRole").value
    };
    const validationError = validateUser(payload, true);
    if (validationError) {
      setMessage("createMessage", validationError, "error");
      return;
    }
    try {
      const response = await apiPost("/users", payload);
      setMessage("createMessage", response.message || "User created.", "success");
      createForm.reset();
      currentPage = 1;
      await loadUsers();
    } catch (error) {
      setMessage("createMessage", error.message || "Unable to create the user.", "error");
    }
  }

  function openEdit(user) {
    document.getElementById("editUserId").value = user.userId;
    document.getElementById("editFullName").value = user.fullName;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editPhone").value = user.phone || "";
    document.getElementById("editRole").value = user.roleName;
    clearMessage("editMessage");
    dialog.showModal();
  }

  async function updateUser(event) {
    event.preventDefault();
    const userId = Number(document.getElementById("editUserId").value);
    const payload = {
      fullName: document.getElementById("editFullName").value.trim(),
      email: document.getElementById("editEmail").value.trim().toLowerCase(),
      phone: document.getElementById("editPhone").value.trim(),
      role: document.getElementById("editRole").value
    };
    const validationError = validateUser(payload, false);
    if (validationError) {
      setMessage("editMessage", validationError, "error");
      return;
    }
    try {
      await apiPut(`/users/${userId}`, payload);
      dialog.close();
      HC.showToast("User account updated.");
      await loadUsers();
    } catch (error) {
      setMessage("editMessage", error.message || "Unable to update the user.", "error");
    }
  }

  async function handleAction(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const userId = Number(event.target.closest("[data-user-id]")?.dataset.userId);
    if (!action || !userId) return;
    const user = users.find((candidate) => candidate.userId === userId);
    if (action === "edit") {
      openEdit(user);
      return;
    }
    if (action === "status") {
      const status = window.prompt("Enter Active, Suspended or Deactivated:", user.accountStatus)?.trim();
      if (!status) return;
      if (!["Active", "Suspended", "Deactivated"].includes(status)) {
        setMessage("listMessage", "Select a valid account status.", "error");
        return;
      }
      try {
        await apiPatch(`/users/${userId}/status`, { status });
        HC.showToast("Account status updated.");
        await loadUsers();
      } catch (error) {
        setMessage("listMessage", error.message || "Unable to update account status.", "error");
      }
      return;
    }
    if (!window.confirm(`Deactivate ${user.fullName}?`)) return;
    try {
      await apiDelete(`/users/${userId}`);
      HC.showToast("User account deactivated.");
      await loadUsers();
    } catch (error) {
      setMessage("listMessage", error.message || "Unable to deactivate the user.", "error");
    }
  }

  function searchUsers(event) {
    event.preventDefault();
    currentPage = 1;
    loadUsers();
  }

  function changePage(change) {
    currentPage += change;
    loadUsers();
  }

  function validateUser(payload, requirePassword) {
    if (payload.fullName.length < 2 || payload.fullName.length > 120) return "Full name must contain 2 to 120 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Enter a valid email address.";
    if (payload.phone && !/^[689]\d{7}$/.test(payload.phone)) return "Enter a valid 8-digit Singapore phone number.";
    if (requirePassword && (payload.password.length < 8 || !/[A-Za-z]/.test(payload.password) || !/\d/.test(payload.password))) return "Password must have at least 8 characters, one letter and one number.";
    return "";
  }

  function setMessage(id, text, type) {
    const element = document.getElementById(id);
    element.textContent = text;
    element.hidden = false;
    element.className = type === "error" ? "notice notice-danger" : type === "success" ? "notice notice-success" : "notice";
  }

  function clearMessage(id) {
    const element = document.getElementById(id);
    element.hidden = true;
    element.textContent = "";
  }
});
