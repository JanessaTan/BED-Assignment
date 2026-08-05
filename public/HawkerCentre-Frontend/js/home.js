document.addEventListener("DOMContentLoaded", function initialiseHome() {
  if (!HC.initPage("home", ["customer", "guest"])) return;

  const user = HC.getCurrentUser();
  document.getElementById("welcomeHeading").textContent = `Hello, ${user.name}. Find your next hawker favourite.`;

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
    </a>`).join("");

  document.getElementById("featuredCentres").innerHTML = HC.centres.slice(0, 3).map((centre) => {
    const crowd = HC.calculateCrowd(centre);
    return `
      <article class="card">
        <div class="media-placeholder" role="img" aria-label="Placeholder for ${HC.escapeHtml(centre.name)}">Hawker</div>
        <span class="badge ${HC.crowdBadgeClass(crowd.label)}">${crowd.label} crowd - ${crowd.percentage}%</span>
        <h3>${HC.escapeHtml(centre.name)}</h3>
        <p>${HC.escapeHtml(centre.description)}</p>
        <div class="card-actions"><button class="btn btn-primary" type="button" data-centre="${centre.id}">View stalls</button></div>
      </article>`;
  }).join("");

  const recommended = [...HC.getMenuItems()].filter((item) => item.available).sort((a, b) => b.likes - a.likes).slice(0, 3);
  document.getElementById("recommendedItems").innerHTML = recommended.map((item) => {
    const stall = HC.getStallById(item.stallId);
    return `<article class="card compact-item"><div><h3>${HC.escapeHtml(item.name)}</h3><p class="muted">${HC.escapeHtml(stall.name)} · ${item.prep} min</p></div><div><span class="price">${HC.formatCurrency(item.price)}</span><button class="btn btn-outline" type="button" data-stall="${stall.id}">View</button></div></article>`;
  }).join("");

  const promotions = HC.loadData(HC.KEYS.promotions, []).filter(HC.isPromotionActive).slice(0, 3);
  document.getElementById("homePromotions").innerHTML = promotions.map((promotion) => {
    const stall = HC.getStallById(promotion.stallId);
    return `<article class="card"><span class="badge badge-warning">Active offer</span><h3>${HC.escapeHtml(promotion.title)}</h3><p>${HC.escapeHtml(promotion.description)}</p><p class="muted">${HC.escapeHtml(stall.name)}</p></article>`;
  }).join("");

  document.getElementById("crowdOverview").innerHTML = HC.centres.slice(0, 3).map((centre) => {
    const crowd = HC.calculateCrowd(centre);
    return `<article class="card"><div class="row-between"><h3>${HC.escapeHtml(centre.town)}</h3><span class="badge ${HC.crowdBadgeClass(crowd.label)}">${crowd.label}</span></div><p>${HC.escapeHtml(centre.name)}</p><div class="progress" aria-label="${crowd.percentage}% estimated occupied"><span style="width:${crowd.percentage}%"></span></div><p class="muted">${crowd.seats} estimated seats available</p></article>`;
  }).join("");

  document.getElementById("homeSearchForm").addEventListener("submit", function searchFromHome(event) {
    event.preventDefault();
    const query = document.getElementById("homeSearch").value.trim();
    window.location.href = `browse-hawker-centres.html?q=${encodeURIComponent(query)}`;
  });

  document.addEventListener("click", function handleHomeAction(event) {
    const centreId = event.target.closest("[data-centre]")?.dataset.centre;
    const stallId = event.target.closest("[data-stall]")?.dataset.stall;
    if (centreId) HC.selectCentre(centreId);
    if (stallId) HC.selectStall(stallId);
  });
});
