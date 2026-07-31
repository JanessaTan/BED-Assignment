document.addEventListener("DOMContentLoaded", async () => {
  const app = window.HawkerHub;
  if (!app.requireAuth()) return;
  renderHeader("profile");

  const status = document.getElementById("profileStatus");
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");

  async function loadProfile() {
    try {
      const response = await app.apiRequest("/api/users/me");
      const user = response.data;
      profileForm.fullName.value = user.fullName || "";
      profileForm.email.value = user.email || "";
      profileForm.phone.value = user.phone || "";
      profileForm.role.value = user.roleName || user.role;
      const token = app.getToken();
      app.saveSession(token, user);
    } catch (error) {
      app.showStatus(status, error.message, "error");
    }
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;
    const button = document.getElementById("saveProfile");
    app.setBusy(button, true, "Saving...");
    try {
      const response = await app.apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: profileForm.fullName.value.trim(),
          email: profileForm.email.value.trim(),
          phone: profileForm.phone.value.trim() || null
        })
      });
      app.saveSession(app.getToken(), response.data);
      app.showStatus(status, "Profile updated successfully.", "success");
    } catch (error) {
      app.showStatus(status, error.message, "error");
    } finally {
      app.setBusy(button, false);
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!passwordForm.reportValidity()) return;
    const button = document.getElementById("savePassword");
    app.setBusy(button, true, "Changing...");
    try {
      await app.apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword.value,
          newPassword: passwordForm.newPassword.value
        })
      });
      passwordForm.reset();
      app.showStatus(status, "Password changed successfully.", "success");
    } catch (error) {
      app.showStatus(status, error.message, "error");
    } finally {
      app.setBusy(button, false);
    }
  });

  await loadProfile();
});
