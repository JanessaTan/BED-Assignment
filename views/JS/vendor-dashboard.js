document.addEventListener("DOMContentLoaded", async () => {
  const app = window.HawkerHub;
  const user = app.requireAuth(["vendor"]);
  if (!user) return;
  renderHeader("vendor");
  document.getElementById("vendorWelcome").textContent = `Welcome, ${user.fullName}`;
  const status = document.getElementById("vendorStatus");
  try {
    const response = await app.apiRequest("/api/menu-items/vendor/stalls");
    app.showStatus(
      status,
      response.data.length
        ? `You can manage ${response.data.length} active stall${response.data.length === 1 ? "" : "s"}.`
        : "No active stall agreement is linked to this account.",
      response.data.length ? "success" : "error"
    );
  } catch (error) {
    app.showStatus(status, error.message, "error");
  }
});
