(function () {
  "use strict";

  const stallList = document.getElementById("stallList");
  const stallStatus = document.getElementById("stallStatus");

  function getStallInitial(stallName) {
    const name = String(stallName ?? "").trim();
    return name ? name.charAt(0).toUpperCase() : "H";
  }

  function createActionLink(label, href, variant, accessibleLabel) {
    const link = document.createElement("a");

    link.className = variant ? `btn ${variant}` : "btn";
    link.href = href;
    link.textContent = label;
    link.setAttribute("aria-label", accessibleLabel);

    return link;
  }

  function createStallCard(stall = {}) {
    const stallId = encodeURIComponent(String(stall.StallID ?? "").trim());
    const stallName = String(stall.StallName ?? "").trim() || "Unnamed Stall";
    const stallDescription =
      String(stall.StallDesc ?? "").trim() ||
      "More information about this stall is coming soon.";

    const card = document.createElement("article");
    card.className = "card card--accent card--interactive stall-card";

    const top = document.createElement("div");
    top.className = "stall-top";

    const icon = document.createElement("div");
    icon.className = "stall-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = getStallInitial(stallName);

    const heading = document.createElement("div");
    heading.className = "stall-heading";

    const label = document.createElement("span");
    label.className = "stall-label";
    label.textContent = "HAWKER STALL";

    const title = document.createElement("h2");
    title.className = "card-title stall-name";
    title.textContent = stallName;

    heading.append(label, title);
    top.append(icon, heading);

    const description = document.createElement("p");
    description.className = "soft-panel stall-desc";
    description.textContent = stallDescription;

    const actions = document.createElement("div");
    actions.className = "actions stack-mobile stall-actions";

    actions.append(
      createActionLink(
        "View Menu",
        `Menu.html?stall=${stallId}`,
        "",
        `View menu for ${stallName}`
      ),
      createActionLink(
        "Ratings",
        `rating.html?stall=${stallId}`,
        "secondary",
        `View ratings for ${stallName}`
      ),
      createActionLink(
        "Hygiene",
        `Hygiene.html?stall=${stallId}`,
        "muted",
        `View hygiene information for ${stallName}`
      )
    );

    card.append(top, description, actions);
    return card;
  }

  function showStatus(message, type = "") {
    stallStatus.hidden = false;
    stallStatus.className = type ? `status ${type}` : "status";
    stallStatus.textContent = message;
  }

  function hideStatus() {
    stallStatus.hidden = true;
  }

  function showLoadError() {
    stallStatus.hidden = false;
    stallStatus.className = "status error";
    stallStatus.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = "Unable to load the food stalls.";

    const message = document.createElement("p");
    message.className = "mb-0";
    message.textContent = "Please check your connection and try again.";

    const retryButton = document.createElement("button");
    retryButton.className = "btn stall-retry";
    retryButton.type = "button";
    retryButton.textContent = "Try Again";
    retryButton.addEventListener("click", loadStalls);

    stallStatus.append(heading, message, retryButton);
  }

  async function loadStalls() {
  showStatus("Loading food stalls...");
  stallList.replaceChildren();

  const hawkerCentreId = new URLSearchParams(window.location.search).get("hc");
  const url = hawkerCentreId
    ? `/api/stalls?hc=${encodeURIComponent(hawkerCentreId)}`
    : "/api/stalls";

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const stalls = await response.json();

    if (!Array.isArray(stalls)) {
      throw new Error("The server returned an invalid stalls response.");
    }

    if (stalls.length === 0) {
      showStatus("No food stalls are available at the moment. Please check again later.");
      return;
    }

    const cards = document.createDocumentFragment();
    stalls.forEach((stall) => cards.appendChild(createStallCard(stall)));
    stallList.appendChild(cards);
    hideStatus();
  } catch (error) {
    console.error("Unable to load stalls:", error);
    showLoadError();
  }
}

  loadStalls();
})();