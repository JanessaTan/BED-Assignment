document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  HC.initPage(null, null, { minimal: true });

  const form = document.getElementById("loginForm");
  const identifierInput = document.getElementById("identifier");
  const passwordInput = document.getElementById("password");
  const roleInput = document.getElementById("role");
  const identifierError = document.getElementById("identifierError");
  const passwordError = document.getElementById("passwordError");
  const roleError = document.getElementById("roleError");
  const loginMessage = document.getElementById("loginMessage");
  const submitButton = form.querySelector('button[type="submit"]');
  const togglePassword = document.getElementById("togglePassword");
  const guestButton = document.getElementById("guestButton");

  form.addEventListener("submit", handleLogin);
  togglePassword.addEventListener("click", togglePasswordVisibility);
  guestButton.addEventListener("click", continueAsGuest);

  async function handleLogin(event) {
    event.preventDefault();
    clearMessages();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput.value;

    let valid = true;

    if (!identifier) {
      identifierError.textContent = "Email or username is required.";
      valid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required.";
      valid = false;
    }

    if (!role) {
      roleError.textContent = "Select your account role.";
      valid = false;
    }

    if (!valid) return;

    try {
      setLoading(true);

      const response = await apiPost("/auth/login", {
        identifier,
        password,
        role
      });

      const token = response?.data?.token;
      const loginUser = response?.data?.user;

      if (!token || !loginUser) {
        throw new Error("The login response did not contain a token and user account.");
      }

      HC.setAuthSession(token, loginUser);

      // Confirm the token and refresh the user from the backend.
      const profileResponse = await apiGet("/auth/me");
      const verifiedUser = profileResponse?.data || loginUser;
      HC.setAuthSession(token, verifiedUser);

      showMessage(response.message || "Login successful.", "success");
      redirectAfterLogin(verifiedUser);
    } catch (error) {
      console.error("Login failed:", error);
      showMessage(
        error.status === 401
          ? "The email/username or password is incorrect."
          : error.message || "Unable to log in.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function redirectAfterLogin(user) {
    const requestedPage = new URLSearchParams(window.location.search).get("next");

    if (requestedPage && requestedPage.startsWith("/") && !requestedPage.startsWith("//")) {
      window.location.replace(requestedPage);
      return;
    }

    window.location.replace(HC.getLandingPage(user.roleName || user.role));
  }

  function continueAsGuest() {
    HC.setGuestSession();
    window.location.href = "browse-hawker-centres.html";
  }

  function togglePasswordVisibility() {
    const reveal = passwordInput.type === "password";
    passwordInput.type = reveal ? "text" : "password";
    togglePassword.textContent = reveal ? "Hide" : "Show";
    togglePassword.setAttribute("aria-pressed", String(reveal));
  }

  function clearMessages() {
    identifierError.textContent = "";
    passwordError.textContent = "";
    roleError.textContent = "";
    loginMessage.textContent = "";
    loginMessage.hidden = true;
  }

  function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.hidden = false;
    loginMessage.className = type === "success"
      ? "notice notice-success"
      : "notice notice-danger";
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Signing in..." : "Sign in";
  }
});
