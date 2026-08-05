document.addEventListener("DOMContentLoaded", function initialiseHygieneHistory() {
  if (!HC.initPage("browse", ["customer", "guest"])) return;
  const stallId = HC.getQueryParameter("stall") || HC.resolveSelectedStall();
  const stall = HC.getStallById(stallId);
  if (!stall) {
    window.location.replace("browse-hawker-centres.html");
    return;
  }
  const records = HC.hygieneRecords.filter((record) => record.stallId === stall.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const current = records[0];
  document.getElementById("backToCentre").href = `stalls.html?centre=${encodeURIComponent(stall.centreId)}`;
  document.getElementById("hygieneStallName").textContent = stall.name;

  if (!current) {
    document.getElementById("currentInspection").innerHTML = "<h2>No inspection history is available.</h2>";
    return;
  }
  document.getElementById("currentInspection").innerHTML = `
    <div class="grade-display" aria-label="${HC.hygieneText(current.grade)}">${current.grade}</div>
    <div><span class="badge ${HC.hygieneBadgeClass(current.grade)}">${HC.hygieneText(current.grade)}</span><h2>Current inspection</h2><p><strong>Inspection date:</strong> ${HC.formatDate(current.date)}</p><p><strong>Score:</strong> ${current.score} / 100</p><p><strong>Remarks:</strong> ${HC.escapeHtml(current.remarks)}</p><p><strong>Valid until:</strong> ${HC.formatDate(current.validUntil)}</p></div>`;
  const previous = records.slice(1);
  document.getElementById("hygieneHistory").innerHTML = previous.length
    ? previous.map((record) => `<article class="card history-record"><span class="badge ${HC.hygieneBadgeClass(record.grade)}">${HC.hygieneText(record.grade)}</span><div><h3>${HC.formatDate(record.date)}</h3><p>Score ${record.score} / 100 · Valid until ${HC.formatDate(record.validUntil)}</p><p class="muted">${HC.escapeHtml(record.remarks)}</p></div></article>`).join("")
    : '<div class="empty-state"><h3>No previous grades</h3><p>This demo stall has one recorded inspection.</p></div>';
});
