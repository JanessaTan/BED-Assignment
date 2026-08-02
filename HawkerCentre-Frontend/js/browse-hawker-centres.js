document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const form = document.getElementById("centreSearchForm");
  const searchInput = document.getElementById("centreSearch");
  const results = document.getElementById("centreResults");
  const summary = document.getElementById("resultSummary");
  const noResults = document.getElementById("noResults");
  const apiStatus = document.getElementById("apiStatus");

  searchInput.value = HC.getQueryParameter("q") || "";
  form.addEventListener("submit", handleSearch);
  document.getElementById("clearSearch").addEventListener("click", clearSearch);
  results.addEventListener("click", openCentre);

  await loadCentres(searchInput.value.trim());

  async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    await loadCentres(query);
    if (query.length >= 2) await validateLocation(query);
  }

  async function loadCentres(query) {
    setStatus("Loading hawker centres...", "info");
    const params = new URLSearchParams({ limit: "100" });
    if (query) params.set("search", query);

    try {
      const response = await apiGet(`/hawker-centres?${params}`);
      const centres = response?.data || [];
      render(centres);
      setStatus("Centre information loaded from the HawkerHub database.", "success");
    } catch (error) {
      console.error("Hawker centre retrieval failed:", error);
      render([]);
      setStatus(error.message || "Unable to load hawker centres.", "error");
    }
  }

  async function validateLocation(query) {
    try {
      const response = await apiGet(
        `/hawker-centres/location-search?q=${encodeURIComponent(query)}`
      );
      const matched = response?.data?.length > 0;
      setStatus(
        matched
          ? "The backend location service confirmed a Singapore match."
          : "No Singapore location match was found, but database results are still shown.",
        matched ? "success" : "info"
      );
    } catch (error) {
      setStatus(
        "The external location service is unavailable; database search still works.",
        "info"
      );
    }
  }

  function render(centres) {
    summary.textContent = `${centres.length} hawker centre${centres.length === 1 ? "" : "s"} found`;
    noResults.hidden = centres.length > 0;
    results.innerHTML = centres.map((centre) => `
      <article class="card centre-card">
        <div class="media-placeholder" role="img" aria-label="${HC.escapeHtml(centre.name)}">${HC.escapeHtml(centre.town)}</div>
        <div class="row-between">
          <span class="badge badge-primary">${HC.escapeHtml(centre.town)}</span>
          <span class="badge ${HC.crowdBadgeClass(centre.crowdLevel)}">${HC.escapeHtml(centre.crowdLevel || "Not available")}${centre.crowdPercentage == null ? "" : ` - ${centre.crowdPercentage}%`}</span>
        </div>
        <h2>${HC.escapeHtml(centre.name)}</h2>
        <p>${HC.escapeHtml(centre.description || "Local hawker food and community dining.")}</p>
        <div class="card-meta">
          <span>📍 ${HC.escapeHtml(centre.address)}</span>
          <span>🚇 ${HC.escapeHtml(centre.nearestMrt || "MRT information unavailable")}</span>
          <span>🕒 ${HC.escapeHtml(centre.openingHours || "Hours unavailable")}</span>
          <span>🍽 ${Number(centre.stallCount) || 0} stalls</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-centre-id="${centre.centreId}">View stalls</button>
        </div>
      </article>
    `).join("");
  }

  async function clearSearch() {
    searchInput.value = "";
    searchInput.focus();
    await loadCentres("");
  }

  function openCentre(event) {
    const centreId = event.target.closest("[data-centre-id]")?.dataset.centreId;
    if (centreId) HC.selectCentre(centreId);
  }

  function setStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = type === "error"
      ? "notice notice-danger"
      : type === "success"
        ? "notice notice-success"
        : "api-status";
  }
});
