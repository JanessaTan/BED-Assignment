document.addEventListener("DOMContentLoaded", function initialiseRegistration() {
  HC.ensureSeedData();
  HC.renderHeader("", { minimal: true });
  HC.renderFooter();

  const form = document.getElementById("registerForm");
  const message = document.getElementById("registerMessage");

  function setError(id, text) {
    document.getElementById(id).textContent = text;
  }

  form.addEventListener("submit", function registerAccount(event) {
    event.preventDefault();
    ["fullNameError", "emailError", "passwordError", "confirmPasswordError", "accountTypeError", "termsError"].forEach((id) => setError(id, ""));
    message.hidden = true;

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("accountType").value;
    const termsAccepted = document.getElementById("terms").checked;
    const users = HC.loadData(HC.KEYS.users, []);
    let valid = true;

    if (name.length < 2) {
      setError("fullNameError", "Enter your full name.");
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("emailError", "Enter a valid email address.");
      valid = false;
    } else if (users.some((user) => user.email.toLowerCase() === email)) {
      setError("emailError", "An account with this email already exists.");
      valid = false;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("passwordError", "Use at least 8 characters with a letter and number.");
      valid = false;
    }
    if (password !== confirmPassword) {
      setError("confirmPasswordError", "The passwords do not match.");
      valid = false;
    }
    if (!role) {
      setError("accountTypeError", "Select an account type.");
      valid = false;
    }
    if (!termsAccepted) {
      setError("termsError", "Accept the demonstration terms to continue.");
      valid = false;
    }
    if (!valid) return;

    users.push({
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role,
      ...(role === "vendor" ? { stallId: "clementi-chicken-rice" } : {})
    });
    HC.saveData(HC.KEYS.users, users);
    form.reset();
    message.textContent = "Account created successfully. You can now sign in using your demonstration credentials.";
    message.hidden = false;
    window.setTimeout(() => { window.location.href = "login.html"; }, 1300);
  });
});
