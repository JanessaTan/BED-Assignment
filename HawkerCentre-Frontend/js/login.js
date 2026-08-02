document.addEventListener("DOMContentLoaded", function initialiseLogin() {
  HC.ensureSeedData();
  HC.renderHeader("", { minimal: true });
  HC.renderFooter();

  const form = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const message = document.getElementById("loginMessage");

  function setError(id, text) {
    document.getElementById(id).textContent = text;
  }

  function clearErrors() {
    ["identifierError", "passwordError", "roleError"].forEach((id) => setError(id, ""));
    message.hidden = true;
  }

  togglePassword.addEventListener("click", function togglePasswordVisibility() {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Show" : "Hide";
    togglePassword.setAttribute("aria-pressed", String(!showing));
  });

  form.addEventListener("submit", function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const identifier = document.getElementById("identifier").value.trim().toLowerCase();
    const password = passwordInput.value;
    const role = document.getElementById("role").value;
    let valid = true;

    if (!identifier) {
      setError("identifierError", "Enter your email or username.");
      valid = false;
    }
    if (!password) {
      setError("passwordError", "Enter your password.");
      valid = false;
    }
    if (!role) {
      setError("roleError", "Select the account role.");
      valid = false;
    }
    if (!valid) return;

    const users = HC.loadData(HC.KEYS.users, []);
    const user = users.find((candidate) => {
      const emailMatches = candidate.email.toLowerCase() === identifier;
      const nameMatches = candidate.name.toLowerCase() === identifier;
      return (emailMatches || nameMatches) && candidate.password === password && candidate.role === role;
    });

    if (!user) {
      message.textContent = "The details do not match the selected role. Check the demo account information and try again.";
      message.hidden = false;
      return;
    }

    const safeUser = {
    id: user.id,
    customerID: user.customerID || (user.id === "user-customer-demo" ? "CU000" : null),
    name: user.name,
    email: user.email,
    role: user.role,
    stallId: user.stallId,
    centreId: user.centreId
    };
    HC.setCurrentUser(safeUser);
    const next = HC.getQueryParameter("next");
    const roleLandingPages = {
      customer: "home.html",
      vendor: "vendor-dashboard.html",
      nea_officer: "nea-dashboard.html",
      operator: "operator-dashboard.html"
    };
    window.location.href = next || roleLandingPages[user.role] || "home.html";
  });

  document.getElementById("guestButton").addEventListener("click", function continueAsGuest() {
    HC.setCurrentUser({ id: `guest-${Date.now()}`, name: "Guest", role: "guest" });
    window.location.href = "home.html";
  });
});
