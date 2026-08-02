(function createApiClient(global) {
  "use strict";

  const isLiveServer = ["5500", "5501"].includes(window.location.port);
  const API_BASE_URL = isLiveServer
    ? "http://localhost:3000/api"
    : "/api";

  function getLoginPageUrl() {
    const currentPage = window.location.pathname.split("/").pop();
    if (["login.html", "register.html"].includes(currentPage)) {
      return null;
    }

    const next = encodeURIComponent(
      window.location.pathname + window.location.search
    );

    return `login.html?next=${next}`;
  }

  async function readResponse(response) {
    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error("The server returned invalid JSON.");
      }
    }

    if (text.trim().startsWith("<")) {
      return {
        success: false,
        message: "The server returned an HTML page instead of API data. Check the API URL and backend route."
      };
    }

    return {
      success: response.ok,
      message: text
    };
  }

  async function apiRequest(endpoint, options = {}) {
    if (!endpoint || !String(endpoint).startsWith("/")) {
      throw new Error("API endpoints must begin with /. ");
    }

    const token = global.HC?.getAuthToken?.();
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
    } catch (networkError) {
      const error = new Error(
        "Cannot connect to the HawkerHub backend. Confirm that Node.js is running on port 3000."
      );
      error.cause = networkError;
      error.isNetworkError = true;
      throw error;
    }

    const data = await readResponse(response);

    if (!response.ok) {
      const error = new Error(
        data?.message || `Request failed with HTTP ${response.status}.`
      );

      error.status = response.status;
      error.data = data;
      error.errors = Array.isArray(data?.errors) ? data.errors : [];

      if (response.status === 401 && token) {
        global.HC?.clearAuthSession?.();
        const loginUrl = getLoginPageUrl();
        if (loginUrl) window.location.replace(loginUrl);
      }

      throw error;
    }

    return data;
  }

  function apiGet(endpoint) {
    return apiRequest(endpoint, { method: "GET" });
  }

  function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  function apiPatch(endpoint, body) {
    return apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: "DELETE" });
  }

  global.API_BASE_URL = API_BASE_URL;
  global.apiRequest = apiRequest;
  global.apiGet = apiGet;
  global.apiPost = apiPost;
  global.apiPut = apiPut;
  global.apiPatch = apiPatch;
  global.apiDelete = apiDelete;
})(window);
