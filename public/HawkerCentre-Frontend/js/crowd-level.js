document.addEventListener("DOMContentLoaded", function initialiseCrowdLevels() {
  if (!HC.initPage("crowd", ["customer", "guest"])) return;
  const target = document.getElementById("crowdResults");

  function peakHours() {
    return "Typical peaks: 11:30 AM-1:30 PM and 6:00 PM-8:00 PM";
  }

  function render(refreshAll) {
    target.innerHTML = HC.centres.map((centre) => {
      const crowd = HC.calculateCrowd(centre, Boolean(refreshAll));
      return `
        <article class="card crowd-card">
          <div class="row-between"><span class="badge badge-primary">${HC.escapeHtml(centre.town)}</span><span class="badge ${HC.crowdBadgeClass(crowd.label)}">${crowd.label}</span></div>
          <h2>${HC.escapeHtml(centre.name)}</h2><p>${HC.escapeHtml(centre.address)}</p>
          <span class="crowd-percentage">${crowd.percentage}% estimated occupied</span>
          <div class="progress" aria-label="${crowd.percentage}% estimated occupied"><span style="width:${crowd.percentage}%"></span></div>
          <p><strong>${crowd.seats}</strong> estimated seats available</p><p class="muted">${peakHours()}</p>
          <time datetime="${crowd.updatedAt}">Last updated ${HC.formatDate(crowd.updatedAt, true)}</time>
          <div class="card-actions"><button class="btn btn-outline" type="button" data-refresh="${centre.id}">Refresh</button><button class="btn btn-primary" type="button" data-centre="${centre.id}">View stalls</button></div>
        </article>`;
    }).join("");
  }

  document.getElementById("refreshAll").addEventListener("click", function refreshAll() {
    render(true);
    HC.showToast("All crowd estimates were refreshed.");
  });
  target.addEventListener("click", function crowdAction(event) {
    const centreId = event.target.closest("[data-centre]")?.dataset.centre;
    const refreshId = event.target.closest("[data-refresh]")?.dataset.refresh;
    if (centreId) HC.selectCentre(centreId);
    if (refreshId) {
      const centre = HC.getCentreById(refreshId);
      HC.calculateCrowd(centre, true);
      render(false);
      HC.showToast(`${centre.name} estimate refreshed.`);
    }
  });
  render(false);
});
