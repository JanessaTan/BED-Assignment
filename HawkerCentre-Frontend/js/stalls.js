document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const centreId = Number(HC.resolveSelectedCentre());
  if (!Number.isInteger(centreId) || centreId < 1) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  const resultCount = document.getElementById("stallResultCount");
  const results = document.getElementById("stallResults");
  const empty = document.getElementById("stallEmpty");
  const cuisineFilter = document.getElementById("cuisineFilter");
  let allStalls = [];

  ["stallSearch", "cuisineFilter", "hygieneFilter", "stallSort"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "stallSearch" ? "input" : "change", render);
  });
  results.addEventListener("click", openMenu);

  await loadPage();

  async function loadPage() {
    resultCount.textContent = "Loading stalls from the database...";
    try {
      const [centreResponse, stallResponse, cuisineResponse] = await Promise.all([
        apiGet(`/hawker-centres/${centreId}`),
        apiGet(`/hawker-centres/${centreId}/stalls?limit=100`),
        apiGet("/cuisines")
      ]);

      const centre = centreResponse?.data;
      allStalls = stallResponse?.data || [];
      if (!centre) throw new Error("The selected hawker centre was not found.");

      document.getElementById("centreName").textContent = centre.name;
      document.getElementById("centreAddress").textContent = [
        centre.address,
        centre.nearestMrt ? `Near ${centre.nearestMrt}` : null
      ].filter(Boolean).join(" · ");

      const crowdBadge = document.getElementById("centreCrowd");
      crowdBadge.className = `badge ${HC.crowdBadgeClass(centre.crowdLevel)}`;
      crowdBadge.textContent = centre.crowdLevel
        ? `${centre.crowdLevel} crowd${centre.crowdPercentage == null ? "" : ` - ${centre.crowdPercentage}%`}`
        : "Crowd information unavailable";

      const cuisines = cuisineResponse?.data || [];
      cuisineFilter.insertAdjacentHTML(
        "beforeend",
        cuisines.map((cuisine) => `<option value="${cuisine.cuisineId}">${HC.escapeHtml(cuisine.name)}</option>`).join("")
      );
      render();
    } catch (error) {
      console.error("Stall retrieval failed:", error);
      allStalls = [];
      render();
      resultCount.textContent = error.message || "Unable to load stalls.";
    }
  }

  function render() {
    const query = document.getElementById("stallSearch").value.trim().toLowerCase();
    const cuisineName = cuisineFilter.options[cuisineFilter.selectedIndex]?.text || "";
    const cuisineId = cuisineFilter.value;
    const grade = document.getElementById("hygieneFilter").value;
    const sort = document.getElementById("stallSort").value;

    const stalls = allStalls.filter((stall) => {
      const searchable = `${stall.name} ${stall.description || ""} ${(stall.cuisines || []).join(" ")}`.toLowerCase();
      const matchesCuisine = !cuisineId || (stall.cuisines || []).includes(cuisineName);
      return searchable.includes(query) && matchesCuisine && (!grade || stall.hygieneGrade === grade);
    });

    stalls.sort((left, right) => {
      if (sort === "name") return left.name.localeCompare(right.name);
      return Number(right.averageRating || 0) - Number(left.averageRating || 0);
    });

    resultCount.textContent = `${stalls.length} stall${stalls.length === 1 ? "" : "s"} found`;
    empty.hidden = stalls.length > 0;
    results.innerHTML = stalls.map((stall) => {
      const gradeText = stall.hygieneGrade
        ? HC.hygieneText(stall.hygieneGrade)
        : "Hygiene grade not available";
      return `
        <article class="card stall-card">
          <div class="row-between">
            <span class="badge badge-primary">${HC.escapeHtml((stall.cuisines || []).join(" · ") || "Cuisine not tagged")}</span>
            <span class="badge ${HC.hygieneBadgeClass(stall.hygieneGrade)}">${HC.escapeHtml(gradeText)}</span>
          </div>
          <h2>${HC.escapeHtml(stall.name)}</h2>
          <p>${HC.escapeHtml(stall.description || "No description provided.")}</p>
          <div class="card-meta">
            <span>Unit ${HC.escapeHtml(stall.unitNumber)}</span>
            <span>🕒 ${HC.escapeHtml(stall.openingHours || "Hours unavailable")}</span>
            <span>★ ${Number(stall.averageRating || 0).toFixed(1)} (${Number(stall.feedbackCount) || 0} reviews)</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" type="button" data-stall-id="${stall.stallId}">View menu</button>
            <a class="btn btn-outline" href="hygiene.html?stall=${stall.stallId}">View hygiene history</a>
          </div>
        </article>
      `;
    }).join("");
  }

  function openMenu(event) {
    const stallId = event.target.closest("[data-stall-id]")?.dataset.stallId;
    if (stallId) HC.selectStall(stallId);
  }
});
