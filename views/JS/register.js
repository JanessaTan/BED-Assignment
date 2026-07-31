document.addEventListener("DOMContentLoaded", () => {
  const { apiRequest, setBusy, showStatus } = window.HawkerHub;
  const form = document.getElementById("registerForm");
  const status = document.getElementById("registerStatus");
  const button = document.getElementById("registerButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.password.value !== form.confirmPassword.value) {
      showStatus(status, "The two passwords do not match.", "error");
      return;
    }

    setBusy(button, true, "Creating account...");
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim() || null,
          password: form.password.value
        })
      });
      sessionStorage.setItem("hh.notice", "Account created. You can now log in.");
      window.location.href = "login.html";
    } catch (error) {
      const details = error.errors?.length ? ` ${error.errors.join(" ")}` : "";
      showStatus(status, `${error.message}${details}`, "error");
    } finally {
      setBusy(button, false);
    }
  });
});
