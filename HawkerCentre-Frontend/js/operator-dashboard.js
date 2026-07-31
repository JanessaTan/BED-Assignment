document.addEventListener("DOMContentLoaded", function initialiseOperatorDashboard() {
  if (!HC.initPage("operator-dashboard", ["operator"])) return;
  const user = HC.getCurrentUser();
  const centreId = user.centreId || "clementi-centre-01";
  const centre = HC.getCentreById(centreId);
  const centreStalls = HC.stalls.filter((stall) => stall.centreId === centreId);
  const stallIds = centreStalls.map((stall) => stall.id);
  const agreements = HC.loadData(HC.KEYS.rentalAgreements, []).filter((agreement) => agreement.centreId === centreId);
  const complaints = HC.loadData(HC.KEYS.complaints, []).filter((complaint) => stallIds.includes(complaint.stallId));
  const operations = HC.loadData(HC.KEYS.stallOperations, []).filter((record) => stallIds.includes(record.stallId));

  document.getElementById("operatorWelcome").textContent = `Welcome, ${user.name}.`;
  document.getElementById("operatorStats").innerHTML = [
    ["Managed stalls", centreStalls.length],
    ["Active agreements", agreements.filter((agreement) => agreement.status === "Active").length],
    ["Open complaints", complaints.filter((complaint) => !["Resolved", "Rejected"].includes(complaint.status)).length],
    ["Stalls open", operations.filter((record) => record.operationalStatus === "Open").length]
  ].map(([label, value]) => `<article class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></article>`).join("");

  const actions = [
    ["Centre operations", "Update stall status and maintenance notes.", "centre-operations.html"],
    ["Rental management", "Create, renew and update rental agreements.", "rental-management.html"],
    ["Complaint management", "Review stall-linked complaints and update status.", "complaint-management.html"]
  ];
  document.getElementById("operatorActions").innerHTML = actions.map(([title, text, href]) => `<a class="card operator-action" href="${href}"><h3>${title}</h3><p>${text}</p></a>`).join("");

  const rentalAlerts = agreements.filter((agreement) => agreement.status !== "Active" || new Date(agreement.end) < new Date(Date.now() + 120 * 86400000));
  document.getElementById("rentalAlerts").innerHTML = rentalAlerts.length ? rentalAlerts.map((agreement) => `<div class="notice"><strong>${HC.escapeHtml(HC.getStallById(agreement.stallId)?.name)}</strong><p>${agreement.status} · Ends ${HC.formatDate(agreement.end)}</p><a href="rental-management.html">Review agreement</a></div>`).join("") : '<p class="muted">No rental agreements require immediate attention.</p>';
  document.getElementById("complaintAlerts").innerHTML = complaints.slice(0, 4).map((complaint) => `<div class="notice notice-info"><div class="row-between"><strong>${HC.escapeHtml(complaint.id)}</strong><span class="badge badge-info">${HC.escapeHtml(complaint.status)}</span></div><p>${HC.escapeHtml(complaint.category)} · ${HC.escapeHtml(HC.getStallById(complaint.stallId)?.name)}</p></div>`).join("") || '<p class="muted">No complaints recorded for this centre.</p>';
});
