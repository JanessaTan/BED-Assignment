document.addEventListener("DOMContentLoaded", () => {
  const app = window.HawkerHub;
  if (!app.requireAuth(["administrator"])) return;
  renderHeader("admin-users");

  const rows = document.getElementById("userRows");
  const status = document.getElementById("adminStatus");
  const filters = document.getElementById("userFilters");
  const editor = document.getElementById("userEditor");
  const form = document.getElementById("userForm");
  let page = 1;
  let pages = 1;
  let users = [];

  function linkedProfile(user) {
    return user.customerId || user.ownerId || user.operatorId || user.officerId || "Not linked";
  }

  function makeButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function renderRows() {
    rows.replaceChildren();
    if (!users.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = "No users match these filters.";
      row.appendChild(cell);
      rows.appendChild(row);
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("tr");
      const identity = document.createElement("td");
      const name = document.createElement("strong");
      name.textContent = user.fullName;
      const email = document.createElement("div");
      email.textContent = user.email;
      identity.append(name, email);

      const role = document.createElement("td");
      role.textContent = user.roleName;
      const state = document.createElement("td");
      state.textContent = user.isActive ? "Active" : "Inactive";
      const profile = document.createElement("td");
      profile.textContent = linkedProfile(user);
      const actions = document.createElement("td");
      actions.className = "table-actions";
      actions.append(
        makeButton("Edit", "scope-btn secondary", () => openEditor(user)),
        makeButton("Deactivate", "scope-btn danger", () => deactivate(user))
      );
      row.append(identity, role, state, profile, actions);
      rows.appendChild(row);
    });
  }

  async function loadUsers() {
    const params = new URLSearchParams({ page, limit: 10 });
    if (filters.search.value.trim()) params.set("search", filters.search.value.trim());
    if (filters.role.value) params.set("role", filters.role.value);
    if (filters.status.value) params.set("status", filters.status.value);
    app.showStatus(status, "Loading users...");
    try {
      const response = await app.apiRequest(`/api/users?${params}`);
      users = response.data;
      pages = Math.max(1, response.pagination.pages);
      document.getElementById("pageLabel").textContent = `Page ${page} of ${pages}`;
      document.getElementById("previousPage").disabled = page <= 1;
      document.getElementById("nextPage").disabled = page >= pages;
      status.hidden = true;
      renderRows();
    } catch (error) {
      app.showStatus(status, error.message, "error");
    }
  }

  function openEditor(user = null) {
    form.reset();
    document.getElementById("editUserId").value = user?.userId || "";
    document.getElementById("editorTitle").textContent = user ? "Edit user" : "Add user";
    document.getElementById("passwordHint").textContent = user ? "(leave blank to keep current)" : "(required)";
    document.getElementById("userPassword").required = !user;
    document.getElementById("profileField").hidden = Boolean(user);
    document.getElementById("activeField").hidden = !user;

    if (user) {
      form.fullName.value = user.fullName;
      form.email.value = user.email;
      form.phone.value = user.phone || "";
      form.role.value = user.role;
      form.isActive.value = String(Boolean(user.isActive));
    }
    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth" });
  }

  async function deactivate(user) {
    if (!user.isActive) return;
    if (!window.confirm(`Deactivate ${user.fullName}? They will no longer be able to log in.`)) return;
    try {
      await app.apiRequest(`/api/users/${user.userId}`, { method: "DELETE" });
      app.showStatus(status, "User deactivated successfully.", "success");
      await loadUsers();
    } catch (error) {
      app.showStatus(status, error.message, "error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const userId = document.getElementById("editUserId").value;
    const payload = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || null,
      role: form.role.value
    };
    if (form.password.value) {
      payload[userId ? "newPassword" : "password"] = form.password.value;
    }
    if (userId) payload.isActive = form.isActive.value === "true";
    if (!userId && form.profileId.value.trim()) payload.profileId = form.profileId.value.trim();

    const button = document.getElementById("saveUser");
    app.setBusy(button, true, "Saving...");
    try {
      await app.apiRequest(userId ? `/api/users/${userId}` : "/api/users", {
        method: userId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      editor.hidden = true;
      app.showStatus(status, `User ${userId ? "updated" : "created"} successfully.`, "success");
      await loadUsers();
    } catch (error) {
      const details = error.errors?.length ? ` ${error.errors.join(" ")}` : "";
      app.showStatus(status, `${error.message}${details}`, "error");
    } finally {
      app.setBusy(button, false);
    }
  });

  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1;
    loadUsers();
  });
  document.getElementById("newUserButton").addEventListener("click", () => openEditor());
  document.getElementById("cancelUser").addEventListener("click", () => {
    editor.hidden = true;
  });
  document.getElementById("previousPage").addEventListener("click", () => {
    if (page > 1) {
      page -= 1;
      loadUsers();
    }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    if (page < pages) {
      page += 1;
      loadUsers();
    }
  });

  loadUsers();
});
