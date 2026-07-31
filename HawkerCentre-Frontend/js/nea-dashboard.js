document.addEventListener("DOMContentLoaded", function initialiseNeaDashboard() {
  if (!HC.initPage("nea-dashboard", ["nea_officer"])) return;

  const user = HC.getCurrentUser();
  const inspections = HC.getInspections();
  const completed = inspections.filter((record) => record.status === "Completed");
  const scheduled = inspections.filter((record) => record.status === "Scheduled");
  const lowerGrades = completed.filter((record) => ["C", "D"].includes(record.grade));
  const validGrades = completed.filter((record) => record.validUntil && new Date(record.validUntil) >= new Date());

  document.getElementById("neaWelcome").textContent = `Welcome, ${user.name}.`;
  document.getElementById("neaStats").innerHTML = [
    ["Completed inspections", completed.length],
    ["Scheduled inspections", scheduled.length],
    ["Grades C or D", lowerGrades.length],
    ["Currently valid grades", validGrades.length]
  ].map(([label, value]) => `<article class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></article>`).join("");

  const recent = [...completed].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById("recentInspections").innerHTML = recent.map((record) => {
    const stall = HC.getStallById(record.stallId);
    return `<article class="notice notice-info"><div class="row-between"><strong>${HC.escapeHtml(stall?.name || "Food stall")}</strong><span class="badge ${HC.hygieneBadgeClass(record.grade)}">${HC.hygieneText(record.grade)}</span></div><p>Score ${record.score}/100 · ${HC.formatDate(record.date)}</p></article>`;
  }).join("");

  const alerts = [
    ...scheduled.map((record) => ({ title: `Scheduled: ${HC.getStallById(record.stallId)?.name}`, text: HC.formatDate(record.scheduledDate || record.date), type: "info" })),
    ...lowerGrades.map((record) => ({ title: `${HC.hygieneText(record.grade)}: ${HC.getStallById(record.stallId)?.name}`, text: record.remarks, type: "warning" }))
  ];
  document.getElementById("neaAlerts").innerHTML = alerts.length
    ? alerts.slice(0, 6).map((alert) => `<article class="notice ${alert.type === "info" ? "notice-info" : ""}"><strong>${HC.escapeHtml(alert.title)}</strong><p>${HC.escapeHtml(alert.text)}</p></article>`).join("")
    : '<div class="empty-state"><h3>No urgent alerts</h3><p>No scheduled inspections or lower grades require attention.</p></div>';
});
