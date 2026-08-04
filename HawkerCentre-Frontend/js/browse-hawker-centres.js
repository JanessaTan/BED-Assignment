document.addEventListener("DOMContentLoaded", function initialiseCentreBrowser() {
  "use strict";
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const searchInput = document.getElementById("centreSearch");
  const results = document.getElementById("centreResults");
  const summary = document.getElementById("resultSummary");
  const noResults = document.getElementById("noResults");
  const apiStatus = document.getElementById("apiStatus");
  const searchForm = document.getElementById("centreSearchForm");
  const clearButton = document.getElementById("clearSearch");
  let allCentres = [];

  searchInput.value = HC.getQueryParameter("q") || "";

  function normalise(value) {
    return String(value || "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  function filterCentres(query) {
    const cleaned = normalise(query);
    if (!cleaned) return allCentres;
    return allCentres.filter((centre) => {
      const searchable = [centre.name, centre.town, centre.address, centre.mrt, centre.description].map(normalise).join(" ");
      return searchable.includes(cleaned);
    });
  }

  function crowdMarkup(centre) {
    const crowd = HC.calculateCrowd(centre);
    if (crowd.percentage === null) return '<span class="badge badge-neutral">Crowd unavailable</span>';
    return `<span class="badge ${HC.crowdBadgeClass(crowd.label)}">${HC.escapeHtml(crowd.label)} - ${crowd.percentage}%</span>`;
  }

  function render(centres) {
    summary.textContent = `${centres.length} hawker centre${centres.length === 1 ? "" : "s"} found`;
    noResults.hidden = centres.length > 0;
    results.innerHTML = centres.map((centre) => {
      const locationMeta = [centre.address && `📍 ${HC.escapeHtml(centre.address)}`, centre.mrt && `🚇 ${HC.escapeHtml(centre.mrt)}`, centre.hours && `🕒 ${HC.escapeHtml(centre.hours)}`].filter(Boolean);
      const stallCount = centre.stallCount;
      if (stallCount !== null) locationMeta.push(`🍽 ${stallCount} stall${stallCount === 1 ? "" : "s"}`);
      return `
        <article class="card centre-card">
          <div class="media-placeholder" role="img" aria-label="${HC.escapeHtml(centre.name)}">${HC.escapeHtml(centre.town || "Hawker centre")}</div>
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(centre.town || "Singapore")}</span>${crowdMarkup(centre)}</div>
          <h2>${HC.escapeHtml(centre.name)}</h2>
          <p>${HC.escapeHtml(centre.description || "No description is currently available.")}</p>
          <div class="card-meta">${locationMeta.map((item) => `<span>${item}</span>`).join("")}</div>
          <div class="card-actions"><button class="btn btn-primary" type="button" data-centre="${HC.escapeHtml(centre.id)}">View stalls</button></div>
        </article>`;
    }).join("");
  }

  function runSearch() {
    render(filterCentres(searchInput.value));
  }

  async function loadCentres() {
    apiStatus.textContent = "Loading hawker centres from the database…";
    results.innerHTML = "";
    try {
      allCentres = (await HC.fetchCentres({ limit: 100, activeOnly: true })).filter((centre) => centre.isActive);
      apiStatus.textContent = "";
      runSearch();
    } catch (error) {
      console.error("Could not load centres.", error);
      allCentres = [];
      render([]);
      apiStatus.textContent = `Unable to load hawker centres: ${error.message}`;
      HC.showToast("Could not load hawker centres from the server.", "error");
    }
  }

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });

  searchInput?.addEventListener("input", runSearch);

  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    runSearch();
    searchInput.focus();
  });

  results?.addEventListener("click", (event) => {
    const centreId = event.target.closest("[data-centre]")?.dataset.centre;
    if (centreId) HC.selectCentre(centreId);
  });

  loadCentres();
});
