document.addEventListener("DOMContentLoaded", function initialiseRentalManagement() {
  if (!HC.initPage("rental-management", ["operator"])) return;
  const centreId = HC.getCurrentUser().centreId || "clementi-centre-01";
  const form = document.getElementById("rentalForm");
  const stallInput = document.getElementById("rentalStall");
  const centreStalls = HC.stalls.filter((stall) => stall.centreId === centreId);
  stallInput.insertAdjacentHTML("beforeend", centreStalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join(""));

  function clearForm() {
    form.reset();
    document.getElementById("agreementId").value = "";
    document.getElementById("rentalFormTitle").textContent = "Create rental agreement";
    document.getElementById("rentalError").textContent = "";
  }

  function render() {
    const agreements = HC.loadData(HC.KEYS.rentalAgreements, []).filter((agreement) => agreement.centreId === centreId).sort((a, b) => new Date(b.start) - new Date(a.start));
    document.getElementById("rentalTableBody").innerHTML = agreements.map((agreement) => `<tr data-agreement="${agreement.id}"><td><strong>${HC.escapeHtml(agreement.id)}</strong></td><td>${HC.escapeHtml(HC.getStallById(agreement.stallId)?.name)}<br>${HC.escapeHtml(agreement.unit)}</td><td>${HC.formatDate(agreement.start)} - ${HC.formatDate(agreement.end)}</td><td>${HC.formatCurrency(agreement.monthlyRent)}</td><td><span class="badge ${agreement.status === "Active" ? "badge-success" : agreement.status === "Expired" ? "badge-danger" : "badge-warning"}">${HC.escapeHtml(agreement.status)}</span></td><td><button class="btn btn-outline" type="button" data-edit-agreement="${agreement.id}">Edit / renew</button></td></tr>`).join("");
  }

  document.getElementById("clearRentalForm").addEventListener("click", clearForm);
  document.getElementById("rentalTableBody").addEventListener("click", function editAgreement(event) {
    const id = event.target.closest("[data-edit-agreement]")?.dataset.editAgreement;
    if (!id) return;
    const agreement = HC.loadData(HC.KEYS.rentalAgreements, []).find((candidate) => candidate.id === id);
    document.getElementById("agreementId").value = agreement.id;
    stallInput.value = agreement.stallId;
    document.getElementById("stallUnit").value = agreement.unit;
    document.getElementById("rentalStart").value = agreement.start;
    document.getElementById("rentalEnd").value = agreement.end;
    document.getElementById("monthlyRent").value = agreement.monthlyRent;
    document.getElementById("agreementStatus").value = agreement.status;
    document.getElementById("rentalTerms").value = agreement.terms;
    document.getElementById("rentalFormTitle").textContent = `Update ${agreement.id}`;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("submit", function saveAgreement(event) {
    event.preventDefault();
    const stallId = stallInput.value;
    const unit = document.getElementById("stallUnit").value.trim();
    const start = document.getElementById("rentalStart").value;
    const end = document.getElementById("rentalEnd").value;
    const monthlyRent = Number(document.getElementById("monthlyRent").value);
    const status = document.getElementById("agreementStatus").value;
    const terms = document.getElementById("rentalTerms").value.trim();
    const error = document.getElementById("rentalError");
    error.textContent = "";
    if (!stallId || !unit || !start || !end || end <= start || monthlyRent <= 0 || terms.length < 10) {
      error.textContent = "Complete every field. The end date must be after the start date, rent must be positive and terms must be clear.";
      return;
    }
    const agreements = HC.loadData(HC.KEYS.rentalAgreements, []);
    const existingId = document.getElementById("agreementId").value;
    const agreement = { id: existingId || `RA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, stallId, centreId, unit, start, end, monthlyRent, status, terms };
    const updated = existingId ? agreements.map((candidate) => candidate.id === existingId ? agreement : candidate) : [agreement, ...agreements];
    HC.saveData(HC.KEYS.rentalAgreements, updated);
    HC.showToast(existingId ? "Rental agreement updated." : "Rental agreement created.");
    clearForm();
    render();
  });
  render();
});
