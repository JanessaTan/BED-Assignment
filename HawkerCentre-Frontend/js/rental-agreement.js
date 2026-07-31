document.addEventListener("DOMContentLoaded", function initialiseRentalAgreement() {
  if (!HC.initPage("rental", ["vendor"])) return;
  const agreement = {
    stallUnit: "#01-18",
    centre: "Clementi 448 Market & Food Centre",
    start: "2025-09-01",
    end: "2027-08-31",
    rent: 1850,
    status: "Active",
    terms: [
      "Monthly rent is due by the seventh day of each month.",
      "The stall must comply with food-safety and centre operating requirements.",
      "Renovation or equipment changes require operator approval.",
      "Renewal requests should be submitted at least 90 days before expiry."
    ],
    history: [
      { start: "2023-09-01", end: "2024-08-31", rent: 1680, status: "Completed" },
      { start: "2024-09-01", end: "2025-08-31", rent: 1750, status: "Completed" },
      { start: "2025-09-01", end: "2027-08-31", rent: 1850, status: "Active" }
    ]
  };

  const daysRemaining = Math.ceil((new Date(`${agreement.end}T23:59:59`) - new Date()) / 86400000);
  document.getElementById("renewalReminder").textContent = daysRemaining > 0
    ? `Renewal reminder: ${daysRemaining} days remain before this agreement ends. Begin renewal at least 90 days before expiry.`
    : "This demonstration agreement has reached its end date. Contact the operator.";
  document.getElementById("agreementSummary").innerHTML = [
    ["Stall unit", agreement.stallUnit],
    ["Hawker centre", agreement.centre],
    ["Agreement status", agreement.status],
    ["Start date", HC.formatDate(agreement.start)],
    ["End date", HC.formatDate(agreement.end)],
    ["Monthly rental", HC.formatCurrency(agreement.rent)]
  ].map(([label, value]) => `<article class="card"><span class="stat-label">${label}</span><strong class="stat-value">${HC.escapeHtml(value)}</strong></article>`).join("");
  document.getElementById("termsSummary").innerHTML = agreement.terms.map((term) => `<li>${HC.escapeHtml(term)}</li>`).join("");
  document.getElementById("renewalHistory").innerHTML = agreement.history.map((record) => `<tr><td>${HC.formatDate(record.start)} - ${HC.formatDate(record.end)}</td><td>${HC.formatCurrency(record.rent)}</td><td><span class="badge ${record.status === "Active" ? "badge-success" : "badge-neutral"}">${record.status}</span></td></tr>`).join("");

  document.getElementById("downloadAgreement").addEventListener("click", function downloadSummary() {
    const text = [
      "HAWKERHUB RENTAL AGREEMENT SUMMARY (DEMONSTRATION)",
      `Stall unit: ${agreement.stallUnit}`,
      `Hawker centre: ${agreement.centre}`,
      `Period: ${agreement.start} to ${agreement.end}`,
      `Monthly rental: ${HC.formatCurrency(agreement.rent)}`,
      `Status: ${agreement.status}`,
      "",
      "Terms:",
      ...agreement.terms.map((term, index) => `${index + 1}. ${term}`)
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "rental-agreement-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
    HC.showToast("Rental agreement summary downloaded.");
  });
});
