(function () {
  "use strict";

  const API_BASE = "";
  const TOKEN_KEY = "hh.token";
  const USER_KEY = "hh.user";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    // Compatibility for teammate pages that still read these keys.
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", user.role);
    sessionStorage.setItem("name", user.fullName);
  }

  function clearSession() {
    [TOKEN_KEY, USER_KEY, "token", "role", "name"].forEach((key) =>
      sessionStorage.removeItem(key)
    );
  }

  async function apiRequest(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      const error = new Error("Unable to reach the server. Please try again.");
      error.status = 0;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      if (response.status === 401 && !path.includes("/api/auth/")) {
        clearSession();
        sessionStorage.setItem("hh.notice", "Your session ended. Please log in.");
        window.location.href = "login.html";
      }
      const error = new Error(payload?.message || `Request failed (${response.status})`);
      error.status = response.status;
      error.errors = payload?.errors || [];
      throw error;
    }
    return payload;
  }

  function requireAuth(allowedRoles = []) {
    const user = getUser();
    if (!getToken() || !user) {
      window.location.href = "login.html";
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = "profile.html";
      return null;
    }
    return user;
  }

  function setBusy(button, busy, busyText = "Please wait...") {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function showStatus(element, message, type = "") {
    element.hidden = false;
    element.className = `status-box${type ? ` ${type}` : ""}`;
    element.textContent = message;
  }

  window.HawkerHub = {
    apiRequest,
    getToken,
    getUser,
    saveSession,
    clearSession,
    requireAuth,
    setBusy,
    showStatus
  };
})();
