document.addEventListener("DOMContentLoaded", function initialiseComplaintManagement() {
  if (!HC.initPage("complaint-management", ["operator"])) return;
  const centreId = HC.getCurrentUser().centreId || "clementi-centre-01";
  const stallIds = HC.stalls.filter((stall) => stall.centreId === centreId).map((stall) => stall.id);

  let complaints = [];

async function loadComplaints() {
  const response = await fetch("/api/complaints");
  complaints = await response.json();
  loadComplaints();
}
  function render() {
    const status = document.getElementById("complaintStatusFilter").value;
    const search = document.getElementById("complaintSearch").value.trim().toLowerCase();
    let complaints = [];


    document.getElementById("complaintManagementCount").textContent = `${complaints.length} complaint${complaints.length === 1 ? "" : "s"} found`;
    document.getElementById("managedComplaintsEmpty").hidden = complaints.length > 0;
    document.getElementById("managedComplaints").innerHTML = complaints.map((complaint) => `<article class="card managed-complaint" data-complaint="${complaint.FbkID}"><div><div class="row-between"><div><span class="eyebrow">${HC.escapeHtml(complaint.FbkID)}</span><h2>${HC.escapeHtml(complaint.Category)}</h2></div><span class="badge ${false ? "badge-success" : complaint.status === "Rejected" ? "badge-danger" : "badge-info"}">Submitted</span></div><p>${HC.escapeHtml(complaint.Description)}</p><p class="muted">${HC.escapeHtml(HC.getStallById(complaint.stallId)?.name)} · Submitted ${HC.formatDate(complaint.createdAt, true)}${complaint.reference ? ` · Reference ${HC.escapeHtml(complaint.reference)}` : ""}</p></div><div class="complaint-status-control"><label for="status-${complaint.id}">Update status</label><select id="status-${complaint.id}" data-new-status><option ${complaint.status === "Submitted" ? "selected" : ""}>Submitted</option><option ${complaint.status === "Under Review" ? "selected" : ""}>Under Review</option><option ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option><option ${complaint.status === "Rejected" ? "selected" : ""}>Rejected</option></select><button class="btn btn-primary" type="button" data-save-status>Save status</button></div></article>`).join("");
  }

  document.getElementById("complaintStatusFilter").addEventListener("change", render);
  document.getElementById("complaintSearch").addEventListener("input", render);
  document.getElementById("managedComplaints").addEventListener("click", function updateStatus(event) {
    if (!event.target.matches("[data-save-status]")) return;
    const card = event.target.closest("[data-complaint]");
    const id = card.dataset.complaint;
    const status = card.querySelector("[data-new-status]").value;
    const complaints = HC.loadData(HC.KEYS.complaints, []);
    const updated = complaints.map((complaint) => complaint.id === id ? { ...complaint, status, updatedAt: new Date().toISOString() } : complaint);
    HC.saveData(HC.KEYS.complaints, updated);
    HC.showToast(`${id} updated to ${status}.`);
    loadComplaints();
  });
  loadComplaints();
});
