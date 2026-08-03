document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  HC.initPage(null, null, { minimal: true });

  const form = document.getElementById("registerForm");
  const message = document.getElementById("registerMessage");
  const submitButton = form.querySelector('button[type="submit"]');
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePassword = document.getElementById("togglePassword");

  form.addEventListener("submit", handleRegistration);
  togglePassword.addEventListener("click", togglePasswordVisibility);

  async function handleRegistration(event) {
    event.preventDefault();
    clearErrors();

    const registration = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      phone: document.getElementById("phone").value.trim(),
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
      role: document.getElementById("role").value,
      termsAccepted: document.getElementById("termsAccepted").checked
    };

    if (!validateRegistration(registration)) return;

    try {
      setLoading(true);

      const response = await apiPost("/auth/register", registration);
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token || !user) {
        throw new Error("The registration response did not contain a token and user account.");
      }

      HC.setAuthSession(token, user);
      showMessage(response.message || "Account created successfully.", "success");

      window.setTimeout(() => {
        window.location.replace(HC.getLandingPage(user.roleName || user.role));
      }, 700);
    } catch (error) {
      console.error("Registration failed:", error);
      applyServerErrors(error.errors || error.data?.errors || []);
      showMessage(error.message || "Unable to create the account.", "error");
    } finally {
      setLoading(false);
    }
  }

  function validateRegistration(values) {
    let valid = true;

    if (values.fullName.length < 2 || values.fullName.length > 120) {
      setFieldError("fullName", "Full name must contain 2 to 120 characters.");
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Enter a valid email address.");
      valid = false;
    }

    if (values.phone && !/^[689]\d{7}$/.test(values.phone)) {
      setFieldError("phone", "Enter a valid 8-digit Singapore phone number.");
      valid = false;
    }

    if (
      values.password.length < 8 ||
      values.password.length > 72 ||
      !/[A-Za-z]/.test(values.password) ||
      !/\d/.test(values.password)
    ) {
      setFieldError("password", "Use 8 to 72 characters with at least one letter and one number.");
      valid = false;
    }

    if (values.confirmPassword !== values.password) {
      setFieldError("confirmPassword", "Passwords do not match.");
      valid = false;
    }

    if (!["Customer", "Vendor"].includes(values.role)) {
      setFieldError("role", "Select Customer or Vendor.");
      valid = false;
    }

    if (!values.termsAccepted) {
      setFieldError("termsAccepted", "You must accept the terms.");
      valid = false;
    }

    return valid;
  }

  function applyServerErrors(errors) {
    errors.forEach((error) => {
      if (error?.field) setFieldError(error.field, error.message);
    });
  }

  function setFieldError(field, text) {
    const element = document.getElementById(`${field}Error`);
    if (element) element.textContent = text;
  }

  function clearErrors() {
    form.querySelectorAll(".field-error").forEach((element) => {
      element.textContent = "";
    });
    message.hidden = true;
    message.textContent = "";
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.hidden = false;
    message.className = type === "success"
      ? "notice notice-success"
      : "notice notice-danger";
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Creating account..." : "Create account";
  }

  function togglePasswordVisibility() {
    const reveal = passwordInput.type === "password";
    const nextType = reveal ? "text" : "password";
    passwordInput.type = nextType;
    confirmPasswordInput.type = nextType;
    togglePassword.textContent = reveal ? "Hide passwords" : "Show passwords";
    togglePassword.setAttribute("aria-pressed", String(reveal));
  }
});
