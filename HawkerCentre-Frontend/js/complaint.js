document.addEventListener("DOMContentLoaded", function initialiseComplaint() {
  if (!HC.initPage("feedback", ["customer", "guest"])) return;

  const stallSelect = document.getElementById("complaintStall");
  stallSelect.insertAdjacentHTML("beforeend", HC.stalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join(""));
  if (HC.getQueryParameter("stall")) stallSelect.value = HC.getQueryParameter("stall");

  function setError(id, text) {
    document.getElementById(id).textContent = text;
  }

  document.getElementById("complaintForm").addEventListener("submit", function submitComplaint(event) {
    event.preventDefault();
    ["complaintStallError", "complaintCategoryError", "complaintDescriptionError"].forEach((id) => setError(id, ""));
    const stallId = stallSelect.value;
    const category = document.getElementById("complaintCategory").value;
    const description = document.getElementById("complaintDescription").value.trim();
    let valid = true;
    if (!stallId) {
      setError("complaintStallError", "Select the food stall.");
      valid = false;
    }
    if (!category) {
      setError("complaintCategoryError", "Select a complaint category.");
      valid = false;
    }
    if (description.length < 20) {
      setError("complaintDescriptionError", "Provide at least 20 characters of clear detail.");
      valid = false;
    }
    if (!valid) return;

    const complaints = HC.loadData(HC.KEYS.complaints, []);
    const complaint = {
      id: `CMP-${Date.now().toString().slice(-8)}`,
      stallId,
      category,
      description,
      reference: document.getElementById("referenceNumber").value.trim(),
      userId: HC.getCurrentUser()?.id || "guest",
      status: "Submitted",
      createdAt: new Date().toISOString()
    };
    complaints.unshift(complaint);
    HC.saveData(HC.KEYS.complaints, complaints);
    event.currentTarget.reset();
    const message = document.getElementById("complaintMessage");
    message.textContent = `Complaint ${complaint.id} was saved with status “Submitted”.`;
    message.hidden = false;
  });
});
