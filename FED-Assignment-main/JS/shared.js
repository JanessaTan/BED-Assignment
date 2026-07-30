// assets/JS/shared.js
function renderHeader(activePage) {
  const role = sessionStorage.getItem("role");
  const isLoggedIn = Boolean(sessionStorage.getItem("token"));

  const customerLinks = [
    { key: "stalls", href: "Stalls.html", label: "Stalls" },
    { key: "menu", href: "Menu.html", label: "Menu" },
    { key: "promotions", href: "Promotion.html", label: "Promotions" }
  ];

  const vendorLinks = [
    { key: "vendor-menu", href: "vendor-menu.html", label: "Menu Management" },
    { key: "vendor-promotions", href: "vendor-promotions.html", label: "Promotions Running" }
  ];

  const links = role === "vendor" ? vendorLinks : customerLinks;

  const linksHtml = links
    .map((link) => {
      const isActive = link.key === activePage;
      return `<a href="${link.href}"${isActive ? ' aria-current="page"' : ""}>${link.label}</a>`;
    })
    .join("");

  const authHtml = isLoggedIn
    ? `<a href="#" id="logoutLink">Log out</a>`
    : `<a href="login.html">Log in</a>`;

  const header = document.createElement("header");
  header.className = "nav";
  header.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" style="font-weight:800;">HawkerHub</a>
      <span class="grow"></span>
      ${linksHtml}
      ${authHtml}
    </div>
  `;

  document.body.prepend(header);

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }
}