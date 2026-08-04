document.addEventListener("DOMContentLoaded", function initialiseStalls() {
  if (!HC.initPage("browse", ["customer", "guest"])) {
  return;
 }

  const centreId = HC.resolveSelectedCentre();
  const centre = HC.getCentreById(centreId);
  if (!centre) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  HC.saveData(HC.KEYS.selectedCentre, centre.id);
  document.getElementById("centreName").textContent = centre.name;
  document.getElementById("centreAddress").textContent = `${centre.address} · Near ${centre.mrt}`;
  const crowd = HC.calculateCrowd(centre);
  const crowdBadge = document.getElementById("centreCrowd");
  crowdBadge.className = `badge ${HC.crowdBadgeClass(crowd.label)}`;
  crowdBadge.textContent = `${crowd.label} crowd - ${crowd.percentage}%`;

  const allStalls = HC.stalls.filter((stall) => stall.centreId === centre.id);
  const cuisines = [...new Set(allStalls.map((stall) => stall.cuisine))].sort();
  document.getElementById("cuisineFilter").insertAdjacentHTML("beforeend", cuisines.map((cuisine) => `<option>${HC.escapeHtml(cuisine)}</option>`).join(""));

  function render() {
    const query = document.getElementById("stallSearch").value.trim().toLowerCase();
    const cuisine = document.getElementById("cuisineFilter").value;
    const grade = document.getElementById("hygieneFilter").value;
    const sort = document.getElementById("stallSort").value;
    let stalls = allStalls.filter((stall) => {
      const matchesQuery = `${stall.name} ${stall.cuisine} ${stall.description}`.toLowerCase().includes(query);
      const currentGrade = HC.getCurrentHygieneRecord(stall.id)?.grade || stall.hygiene;
      return matchesQuery && (!cuisine || stall.cuisine === cuisine) && (!grade || currentGrade === grade);
    });
    stalls.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return sort === "popularity" ? b.popularity - a.popularity : b.rating - a.rating;
    });

    document.getElementById("stallResultCount").textContent = `${stalls.length} stall${stalls.length === 1 ? "" : "s"} found`;
    document.getElementById("stallEmpty").hidden = stalls.length > 0;
    document.getElementById("stallResults").innerHTML = stalls.map((stall) => {
      const promotion = stall.promotionId ? HC.getPromotionById(stall.promotionId) : null;
      const hygieneRecord = HC.getCurrentHygieneRecord(stall.id);
      const hygieneGrade = hygieneRecord?.grade || stall.hygiene;
      return `
        <article class="card stall-card">
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(stall.cuisine)}</span><span class="badge ${HC.hygieneBadgeClass(hygieneGrade)}">${HC.hygieneText(hygieneGrade)}</span></div>
          <h2>${HC.escapeHtml(stall.name)}</h2>
          <p>${HC.escapeHtml(stall.description)}</p>
          <div class="card-meta"><span>🕒 ${HC.escapeHtml(stall.hours)}</span><span class="rating-stars" aria-label="${stall.rating} out of 5 stars">★ ${stall.rating.toFixed(1)}</span><span>Popularity ${stall.popularity}%</span><span>Crowd ${stall.crowd}%</span></div>
          ${promotion && HC.isPromotionActive(promotion) ? `<p class="promotion-note">Offer: ${HC.escapeHtml(promotion.title)}</p>` : ""}
          <div class="card-actions">
            <button class="btn btn-primary" type="button" data-menu="${stall.id}">View menu</button>
            <a class="btn btn-outline" href="hygiene.html?stall=${encodeURIComponent(stall.id)}">View hygiene history</a>
          </div>
        </article>`;
    }).join("");
  }

  ["stallSearch", "cuisineFilter", "hygieneFilter", "stallSort"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "stallSearch" ? "input" : "change", render);
  });
  document.getElementById("stallResults").addEventListener("click", function viewMenu(event) {
    const stallId = event.target.closest("[data-menu]")?.dataset.menu;
    if (stallId) HC.selectStall(stallId);
  });
  render();
});
