document.addEventListener("DOMContentLoaded", async function initialiseHygieneHistory() {
  if (!HC.initPage("browse", ["customer", "guest", "nea_officer"])) return;

  const stallId = HC.getQueryParameter("stall") || HC.resolveSelectedStall();
  if (!stallId) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  let stall;
  try {
    stall = await HC.fetchStallById(stallId);
  } catch (error) {
    console.error("Could not load stall.", error);
    HC.showToast("Could not load this stall from the server.", "error");
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  if (!stall) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }

  document.getElementById("backToCentre").href = HC.getRole() === "nea_officer"
    ? "nea-inspections.html"
    : `stalls.html?centre=${encodeURIComponent(stall.centreId)}`;
  document.getElementById("backToCentre").textContent = HC.getRole() === "nea_officer"
    ? "← Back to inspections"
    : "← Back to stalls";
  document.getElementById("hygieneStallName").textContent = stall.name;

  let current;
  try {
    current = await HC.fetchCurrentInspection(stall.id);
  } catch (error) {
    console.error("Could not load hygiene record.", error);
    document.getElementById("currentInspection").innerHTML = "<h2>Could not load hygiene records right now.</h2>";
    HC.showToast("Could not load hygiene records from the server.", "error");
    return;
  }

  if (!current) {
    document.getElementById("currentInspection").innerHTML = "<h2>No inspection history is available.</h2>";
    return;
  }

  document.getElementById("currentInspection").innerHTML = `
    <div class="grade-display" aria-label="${HC.hygieneText(current.grade)}">${current.grade}</div>
    <div>
      <span class="badge ${HC.hygieneBadgeClass(current.grade)}">${HC.hygieneText(current.grade)}</span>
      <h2>Current inspection</h2>
      <p><strong>Inspection date:</strong> ${HC.formatDate(current.date)}</p>
      <p><strong>Remarks:</strong> ${HC.escapeHtml(current.remarks || "No remarks recorded.")}</p>
      <p><strong>Valid until:</strong> ${HC.formatDate(current.validUntil)}</p>
    </div>`;

  document.getElementById("hygieneHistory").innerHTML =
    '<div class="empty-state"><h3>No previous grades</h3><p>Only the latest inspection is available at this time.</p></div>';
});