document.addEventListener("DOMContentLoaded", function initialiseCentreOperations() {
  if (!HC.initPage("centre-operations", ["operator"])) return;
  const centreId = HC.getCurrentUser().centreId || "clementi-centre-01";
  const centre = HC.getCentreById(centreId);
  const centreStalls = HC.stalls.filter((stall) => stall.centreId === centreId);
  document.getElementById("operationsCentreName").textContent = `${centre.name} operations`;

  function render() {
    const records = HC.loadData(HC.KEYS.stallOperations, []);
    document.getElementById("operationsTableBody").innerHTML = centreStalls.map((stall, index) => {
      const record = records.find((candidate) => candidate.stallId === stall.id) || { operationalStatus: "Open", maintenanceNote: "" };
      return `<tr data-stall="${stall.id}"><td><strong>${HC.escapeHtml(stall.name)}</strong><br><span class="muted">${HC.escapeHtml(stall.hours)}</span></td><td>#01-${18 + index}<br>${HC.escapeHtml(stall.cuisine)}</td><td><label class="sr-only" for="status-${stall.id}">Operating status for ${HC.escapeHtml(stall.name)}</label><select id="status-${stall.id}" data-operation-status><option ${record.operationalStatus === "Open" ? "selected" : ""}>Open</option><option ${record.operationalStatus === "Temporarily Closed" ? "selected" : ""}>Temporarily Closed</option><option ${record.operationalStatus === "Under Maintenance" ? "selected" : ""}>Under Maintenance</option></select></td><td><label class="sr-only" for="note-${stall.id}">Maintenance note for ${HC.escapeHtml(stall.name)}</label><textarea id="note-${stall.id}" data-maintenance-note maxlength="250">${HC.escapeHtml(record.maintenanceNote)}</textarea></td><td><button class="btn btn-primary" type="button" data-save-operation>Save</button></td></tr>`;
    }).join("");
  }

  document.getElementById("operationsTableBody").addEventListener("click", function saveOperation(event) {
    if (!event.target.matches("[data-save-operation]")) return;
    const row = event.target.closest("[data-stall]");
    const stallId = row.dataset.stall;
    const records = HC.loadData(HC.KEYS.stallOperations, []);
    const updatedRecord = { stallId, operationalStatus: row.querySelector("[data-operation-status]").value, maintenanceNote: row.querySelector("[data-maintenance-note]").value.trim(), updatedAt: new Date().toISOString() };
    const updated = records.some((record) => record.stallId === stallId) ? records.map((record) => record.stallId === stallId ? updatedRecord : record) : [...records, updatedRecord];
    HC.saveData(HC.KEYS.stallOperations, updated);
    HC.showToast(`${HC.getStallById(stallId).name} operations updated.`);
    render();
  });
  render();
});
