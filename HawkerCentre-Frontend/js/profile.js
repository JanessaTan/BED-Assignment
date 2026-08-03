document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("profile", [
    "customer",
    "vendor",
    "nea_officer",
    "operator",
    "administrator"
  ])) return;

  const form = document.getElementById("profileForm");
  const message = document.getElementById("profileMessage");
  const saveButton = document.getElementById("saveProfileButton");
  const deactivateButton = document.getElementById("deactivateAccountButton");
  let currentUser = null;

  form.addEventListener("submit", updateProfile);
  deactivateButton.addEventListener("click", deactivateAccount);

  await loadProfile();

  async function loadProfile() {
    setMessage("Loading your profile...", "info");

    try {
      const response = await apiGet("/users/me");
      currentUser = response?.data;

      if (!currentUser) {
        throw new Error("The backend did not return your user profile.");
      }

      HC.setCurrentUser(currentUser);
      fillProfile(currentUser);
      clearMessage();
    } catch (error) {
      console.error("Profile retrieval failed:", error);
      setMessage(error.message || "Unable to load your profile.", "error");
      form.hidden = true;
    }
  }

  async function updateProfile(event) {
    event.preventDefault();
    clearMessage();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();

    if (fullName.length < 2 || fullName.length > 120) {
      setMessage("Full name must contain 2 to 120 characters.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Enter a valid email address.", "error");
      return;
    }

    if (phone && !/^[689]\d{7}$/.test(phone)) {
      setMessage("Enter a valid 8-digit Singapore phone number.", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await apiPut(`/users/${currentUser.userId}`, {
        fullName,
        email,
        phone
      });

      currentUser = response?.data;
      HC.setCurrentUser(currentUser);
      fillProfile(currentUser);
      setMessage(response.message || "Profile updated successfully.", "success");
    } catch (error) {
      console.error("Profile update failed:", error);
      setMessage(error.message || "Unable to update your profile.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAccount() {
    if (!currentUser) return;

    const confirmed = window.confirm(
      "Deactivate your HawkerHub account? You will be logged out immediately."
    );

    if (!confirmed) return;

    try {
      deactivateButton.disabled = true;
      deactivateButton.textContent = "Deactivating...";

      await apiDelete(`/users/${currentUser.userId}`);
      HC.clearAuthSession();
      window.location.replace("login.html?deactivated=1");
    } catch (error) {
      console.error("Account deactivation failed:", error);
      setMessage(error.message || "Unable to deactivate the account.", "error");
      deactivateButton.disabled = false;
      deactivateButton.textContent = "Deactivate my account";
    }
  }

  function fillProfile(user) {
    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("roleName").value = user.roleName || user.role || "";
    document.getElementById("accountStatus").value = user.accountStatus || "";
    document.getElementById("createdAt").textContent = HC.formatDate(user.createdAt, true);
  }

  function setSaving(saving) {
    saveButton.disabled = saving;
    saveButton.textContent = saving ? "Saving..." : "Save profile";
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.hidden = false;
    message.className = type === "success"
      ? "notice notice-success"
      : type === "info"
        ? "notice"
        : "notice notice-danger";
  }

  function clearMessage() {
    message.textContent = "";
    message.hidden = true;
  }
});
