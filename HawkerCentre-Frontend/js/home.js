document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  if (!HC.initPage("home", ["customer", "guest"])) return;

  const user = HC.getCurrentUser();
  document.getElementById("welcomeHeading").textContent =
    `Hello, ${user.fullName || user.name}. Find your next hawker favourite.`;

  const actions = [
    { icon: "⌕", title: "Browse centres", text: "Search by town or MRT.", href: "browse-hawker-centres.html" },
    { icon: "◔", title: "Check crowds", text: "Compare estimated occupancy.", href: "crowd-level.html" },
    { icon: "％", title: "Promotions", text: "Find active local offers.", href: "promotion.html" },
    { icon: "★", title: "Share feedback", text: "Help stalls improve.", href: "feedback.html" }
  ];
  document.getElementById("quickActions").innerHTML = actions.map((action) => `
    <a class="card quick-card" href="${action.href}">
      <span class="quick-icon" aria-hidden="true">${action.icon}</span>
      <h3>${action.title}</h3><p>${action.text}</p>
    </a>
  `).join("");

  document.getElementById("homeSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = document.getElementById("homeSearch").value.trim();
    window.location.href = `browse-hawker-centres.html?q=${encodeURIComponent(query)}`;
  });
  document.addEventListener("click", (event) => {
    const centreId = event.target.closest("[data-centre-id]")?.dataset.centreId;
    const stallId = event.target.closest("[data-stall-id]")?.dataset.stallId;
    if (centreId) HC.selectCentre(centreId);
    if (stallId) HC.selectStall(stallId);
  });

  await loadHomeData();

  async function loadHomeData() {
    try {
      const [centreResponse, menuResponse, promotionResponse] = await Promise.all([
        apiGet("/hawker-centres?limit=3"),
        apiGet("/menu-items?available=true&sort=recommended&limit=3"),
        apiGet("/promotions?active=true&limit=3")
      ]);
      renderCentres(centreResponse?.data || []);
      renderMenuItems(menuResponse?.data || []);
      renderPromotions(promotionResponse?.data || []);
    } catch (error) {
      const safeMessage = HC.escapeHtml(error.message || "Unable to load home information.");
      ["featuredCentres", "recommendedItems", "homePromotions", "crowdOverview"].forEach((id) => {
        document.getElementById(id).innerHTML = `<p class="notice notice-danger">${safeMessage}</p>`;
      });
    }
  }

  function renderCentres(centres) {
    document.getElementById("featuredCentres").innerHTML = centres.map((centre) => `
      <article class="card">
        <div class="media-placeholder" role="img" aria-label="${HC.escapeHtml(centre.name)}">${HC.escapeHtml(centre.town)}</div>
        <span class="badge ${HC.crowdBadgeClass(centre.crowdLevel)}">${HC.escapeHtml(centre.crowdLevel || "Crowd unavailable")}${centre.crowdPercentage == null ? "" : ` - ${centre.crowdPercentage}%`}</span>
        <h3>${HC.escapeHtml(centre.name)}</h3>
        <p>${HC.escapeHtml(centre.description || centre.address)}</p>
        <div class="card-actions"><button class="btn btn-primary" type="button" data-centre-id="${centre.centreId}">View stalls</button></div>
      </article>
    `).join("");

    document.getElementById("crowdOverview").innerHTML = centres.map((centre) => {
      const percentage = Number(centre.crowdPercentage) || 0;
      return `
        <article class="card">
          <div class="row-between"><h3>${HC.escapeHtml(centre.town)}</h3><span class="badge ${HC.crowdBadgeClass(centre.crowdLevel)}">${HC.escapeHtml(centre.crowdLevel || "Unavailable")}</span></div>
          <p>${HC.escapeHtml(centre.name)}</p>
          <div class="progress" aria-label="${percentage}% estimated occupied"><span style="width:${percentage}%"></span></div>
          <p class="muted">${Number(centre.estimatedSeats) || 0} estimated seats available</p>
        </article>
      `;
    }).join("");
  }

  function renderMenuItems(items) {
    document.getElementById("recommendedItems").innerHTML = items.map((item) => `
      <article class="card compact-item">
        <div><h3>${HC.escapeHtml(item.name)}</h3><p class="muted">${HC.escapeHtml(item.stallName)} · ${item.preparationMinutes} min</p></div>
        <div><span class="price">${HC.formatCurrency(item.price)}</span><button class="btn btn-outline" type="button" data-stall-id="${item.stallId}">View</button></div>
      </article>
    `).join("");
  }

  function renderPromotions(promotions) {
    document.getElementById("homePromotions").innerHTML = promotions.map((promotion) => `
      <article class="card"><span class="badge badge-warning">Active offer</span><h3>${HC.escapeHtml(promotion.name)}</h3><p>${HC.escapeHtml(promotion.description)}</p><p class="muted">${HC.escapeHtml(promotion.stallName)}</p></article>
    `).join("");
  }
});
