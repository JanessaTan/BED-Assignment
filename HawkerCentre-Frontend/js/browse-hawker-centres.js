document.addEventListener("DOMContentLoaded", function initialiseCentreBrowser() {
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const searchInput = document.getElementById("centreSearch");
  const results = document.getElementById("centreResults");
  const summary = document.getElementById("resultSummary");
  const noResults = document.getElementById("noResults");
  const apiStatus = document.getElementById("apiStatus");
  searchInput.value = HC.getQueryParameter("q") || "";

  function normalise(value) {
    return value.toLowerCase().trim().replace(/\s+/g, " ");
  }

  async function confirmLocation(query) {
    if (!query) {
      apiStatus.textContent = "";
      return;
    }
    apiStatus.textContent = "Checking the location service…";
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=sg&limit=1&q=${encodeURIComponent(`${query}, Singapore`)}`;
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Location service returned ${response.status}`);
      const data = await response.json();
      apiStatus.textContent = data.length
        ? "Location service found a Singapore match. Showing relevant local demo centres."
        : "No map match was found. Showing matches from local demo data.";
    } catch (error) {
      console.warn("Location lookup unavailable.", error);
      apiStatus.textContent = "Location service is unavailable. Local demo search is still working.";
    }
  }

  function filterCentres(query) {
    const cleaned = normalise(query);
    if (!cleaned) return HC.centres;
    return HC.centres.filter((centre) => {
      const searchable = [centre.name, centre.town, centre.address, centre.mrt].map(normalise).join(" ");
      return searchable.includes(cleaned);
    });
  }

  function render(centres) {
    summary.textContent = `${centres.length} hawker centre${centres.length === 1 ? "" : "s"} found`;
    noResults.hidden = centres.length > 0;
    results.innerHTML = centres.map((centre) => {
      const crowd = HC.calculateCrowd(centre);
      return `
        <article class="card centre-card">
          <div class="media-placeholder" role="img" aria-label="Placeholder for ${HC.escapeHtml(centre.name)}">${HC.escapeHtml(centre.town)}</div>
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(centre.town)}</span><span class="badge ${HC.crowdBadgeClass(crowd.label)}">${crowd.label} - ${crowd.percentage}%</span></div>
          <h2>${HC.escapeHtml(centre.name)}</h2>
          <p>${HC.escapeHtml(centre.description)}</p>
          <div class="card-meta"><span>📍 ${HC.escapeHtml(centre.address)}</span><span>🚇 ${HC.escapeHtml(centre.mrt)}</span><span>🕒 ${HC.escapeHtml(centre.hours)}</span><span>🍽 ${HC.getStallCount(centre.id)} demo stalls</span></div>
          <div class="card-actions"><button class="btn btn-primary" type="button" data-centre="${centre.id}">View stalls</button></div>
        </article>`;
    }).join("");
  }

  async function runSearch() {
    const query = searchInput.value;
    render(filterCentres(query));
    await confirmLocation(query.trim());
  }

  document.getElementById("centreSearchForm").addEventListener("submit", function submitSearch(event) {
    event.preventDefault();
    runSearch();
  });
  document.getElementById("clearSearch").addEventListener("click", function clearSearch() {
    searchInput.value = "";
    apiStatus.textContent = "";
    render(HC.centres);
    searchInput.focus();
  });
  results.addEventListener("click", function openCentre(event) {
    const centreId = event.target.closest("[data-centre]")?.dataset.centre;
    if (centreId) HC.selectCentre(centreId);
  });

  render(filterCentres(searchInput.value));
  if (searchInput.value) confirmLocation(searchInput.value);
});
