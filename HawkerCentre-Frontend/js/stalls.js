document.addEventListener("DOMContentLoaded", function initialiseStalls() {
  "use strict";
  if (!HC.initPage("browse", ["customer", "guest"])) return;

  const centreId = HC.resolveSelectedCentre();
  const resultTarget = document.getElementById("stallResults");
  const emptyTarget = document.getElementById("stallEmpty");
  const countTarget = document.getElementById("stallResultCount");
  const cuisineFilter = document.getElementById("cuisineFilter");
  const hygieneFilter = document.getElementById("hygieneFilter");
  const sortFilter = document.getElementById("stallSort");
  const searchInput = document.getElementById("stallSearch");
  let centre = null;
  let allStalls = [];

  if (!centreId) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  function ratingMarkup(stall) {
    return stall.rating === null ? "" : `<span class="rating-stars" aria-label="${stall.rating} out of 5 stars">★ ${stall.rating.toFixed(1)}</span>`;
  }

  function hygieneMarkup(stall) {
    const grade = stall.hygieneGrade;
    return `<span class="badge ${HC.hygieneBadgeClass(grade)}">${HC.escapeHtml(HC.hygieneText(grade))}</span>`;
  }

  function render() {
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const cuisine = cuisineFilter?.value || "";
    const grade = hygieneFilter?.value || "";
    const sort = sortFilter?.value || "rating";

    const stalls = allStalls.filter((stall) => {
      const matchesQuery = `${stall.name} ${stall.cuisine} ${stall.description} ${stall.unitNumber}`.toLowerCase().includes(query);
      const matchesCuisine = !cuisine || stall.cuisines.includes(cuisine);
      const matchesGrade = !grade || stall.hygieneGrade === grade;
      return matchesQuery && matchesCuisine && matchesGrade;
    });

    stalls.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "popularity") return (b.popularity ?? -1) - (a.popularity ?? -1);
      return (b.rating ?? -1) - (a.rating ?? -1);
    });

    countTarget.textContent = `${stalls.length} stall${stalls.length === 1 ? "" : "s"} found`;
    emptyTarget.hidden = stalls.length > 0;
    resultTarget.innerHTML = stalls.map((stall) => {
      const metadata = [stall.unitNumber && `Unit ${HC.escapeHtml(stall.unitNumber)}`, stall.hours && `🕒 ${HC.escapeHtml(stall.hours)}`, ratingMarkup(stall), stall.feedbackCount !== null && `${stall.feedbackCount} review${stall.feedbackCount === 1 ? "" : "s"}`].filter(Boolean);
      return `
        <article class="card stall-card">
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(stall.cuisine)}</span>${hygieneMarkup(stall)}</div>
          <h2>${HC.escapeHtml(stall.name)}</h2>
          <p>${HC.escapeHtml(stall.description || "No description is currently available.")}</p>
          <div class="card-meta">${metadata.map((item) => `<span>${item}</span>`).join("")}</div>
          <div class="card-actions">
            <button class="btn btn-primary" type="button" data-menu="${HC.escapeHtml(stall.id)}">View menu</button>
            <a class="btn btn-outline" href="hygiene.html?stall=${encodeURIComponent(stall.id)}">View hygiene history</a>
          </div>
        </article>`;
    }).join("");
  }

  async function loadPage() {
    countTarget.textContent = "Loading stalls from the database…";
    resultTarget.innerHTML = "";
    try {
      centre = await HC.fetchCentreById(centreId);
      if (!centre) throw new Error("The selected hawker centre was not found.");
      HC.saveData(HC.KEYS.selectedCentre, centre.id);
      document.getElementById("centreName").textContent = centre.name;
      const addressParts = [centre.address, centre.mrt ? `Near ${centre.mrt}` : ""].filter(Boolean);
      document.getElementById("centreAddress").textContent = addressParts.join(" · ") || "Address unavailable";

      const crowd = HC.calculateCrowd(centre);
      const crowdBadge = document.getElementById("centreCrowd");
      if (crowdBadge) {
        crowdBadge.className = `badge ${HC.crowdBadgeClass(crowd.label)}`;
        crowdBadge.textContent = crowd.percentage === null ? "Crowd unavailable" : `${crowd.label} crowd - ${crowd.percentage}%`;
      }

      allStalls = (await HC.fetchStalls({ centreId: centre.id, limit: 100, activeOnly: true })).filter((stall) => stall.isActive);
      const cuisines = [...new Set(allStalls.flatMap((stall) => stall.cuisines))].sort();
      cuisineFilter?.insertAdjacentHTML("beforeend", cuisines.map((item) => `<option value="${HC.escapeHtml(item)}">${HC.escapeHtml(item)}</option>`).join(""));
      render();
    } catch (error) {
      console.error("Could not load stalls.", error);
      allStalls = [];
      countTarget.textContent = "Unable to load stalls";
      emptyTarget.hidden = false;
      resultTarget.innerHTML = "";
      HC.showToast(error.message || "Could not load stalls from the server.", "error");
    }
  }

  [searchInput, cuisineFilter, hygieneFilter, sortFilter].forEach((element) => {
    element?.addEventListener(element === searchInput ? "input" : "change", render);
  });

  resultTarget?.addEventListener("click", (event) => {
    const stallId = event.target.closest("[data-menu]")?.dataset.menu;
    if (stallId) HC.selectStall(stallId);
  });

  loadPage();
});
