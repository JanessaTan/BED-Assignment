document.addEventListener("DOMContentLoaded", () => {
  const { apiRequest, saveSession, setBusy, showStatus } = window.HawkerHub;
  const form = document.getElementById("loginForm");
  const button = document.getElementById("loginButton");
  const status = document.getElementById("loginStatus");
  const notice = sessionStorage.getItem("hh.notice");
  if (notice) {
    showStatus(status, notice);
    sessionStorage.removeItem("hh.notice");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    setBusy(button, true, "Logging in...");

    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.value.trim(),
          password: form.password.value
        })
      });
      saveSession(response.data.token, response.data.user);
      const destinations = {
        vendor: "vendor-dashboard.html",
        administrator: "admin-users.html"
      };
      window.location.href = destinations[response.data.user.role] || "profile.html";
    } catch (error) {
      showStatus(status, error.message, "error");
    } finally {
      setBusy(button, false);
    }
  });
});
