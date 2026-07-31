document.addEventListener("DOMContentLoaded", function initialiseNeaInspections() {
  if (!HC.initPage("inspections", ["nea_officer"])) return;

  const form = document.getElementById("inspectionForm");
  const statusInput = document.getElementById("inspectionStatus");
  const stallInput = document.getElementById("inspectionStall");
  stallInput.insertAdjacentHTML("beforeend", HC.stalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join(""));
  document.getElementById("inspectionDate").value = new Date().toISOString().slice(0, 10);

  function gradeFromScore(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "D";
  }

  function updateCompletedFields() {
    const completed = statusInput.value === "Completed";
    document.querySelectorAll(".completed-field").forEach((field) => { field.hidden = !completed; });
  }

  function clearErrors() {
    ["inspectionStallError", "inspectionDateError", "inspectionScoreError", "validUntilError", "inspectionRemarksError"].forEach((id) => { document.getElementById(id).textContent = ""; });
  }

  function clearForm() {
    form.reset();
    document.getElementById("inspectionId").value = "";
    document.getElementById("inspectionFormTitle").textContent = "Create inspection record";
    document.getElementById("inspectionDate").value = new Date().toISOString().slice(0, 10);
    clearErrors();
    updateCompletedFields();
  }

  function renderRecords() {
    const filter = document.getElementById("inspectionFilter").value;
    const records = HC.getInspections().filter((record) => !filter || record.status === filter).sort((a, b) => new Date(b.scheduledDate || b.date) - new Date(a.scheduledDate || a.date));
    document.getElementById("inspectionRecords").innerHTML = records.map((record) => {
      const stall = HC.getStallById(record.stallId);
      const completed = record.status === "Completed";
      return `<article class="card inspection-record" data-inspection="${record.id}">
        <div class="inspection-grade" aria-label="${completed ? HC.hygieneText(record.grade) : "Scheduled inspection"}">${completed ? record.grade : "◷"}</div>
        <div><div class="row-between"><h3>${HC.escapeHtml(stall?.name || "Food stall")}</h3><span class="badge ${completed ? HC.hygieneBadgeClass(record.grade) : "badge-info"}">${completed ? HC.hygieneText(record.grade) : "Scheduled"}</span></div><p>${HC.formatDate(record.scheduledDate || record.date)}${completed ? ` · Score ${record.score}/100 · Valid until ${HC.formatDate(record.validUntil)}` : ""}</p><p class="muted">${HC.escapeHtml(record.remarks || "Inspection visit has been scheduled.")}</p></div>
        <div>${completed ? `<a class="btn btn-outline" href="hygiene.html?stall=${encodeURIComponent(record.stallId)}">View history</a>` : `<button class="btn btn-primary" type="button" data-complete="${record.id}">Complete inspection</button>`}</div>
      </article>`;
    }).join("");
  }

  statusInput.addEventListener("change", updateCompletedFields);
  document.getElementById("inspectionFilter").addEventListener("change", renderRecords);
  document.getElementById("clearInspectionForm").addEventListener("click", clearForm);

  document.getElementById("inspectionRecords").addEventListener("click", function prepareCompletion(event) {
    const id = event.target.closest("[data-complete]")?.dataset.complete;
    if (!id) return;
    const record = HC.getInspections().find((candidate) => candidate.id === id);
    if (!record) return;
    document.getElementById("inspectionId").value = record.id;
    stallInput.value = record.stallId;
    statusInput.value = "Completed";
    document.getElementById("inspectionDate").value = record.scheduledDate || record.date;
    document.getElementById("inspectionFormTitle").textContent = "Complete scheduled inspection";
    updateCompletedFields();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("submit", function saveInspection(event) {
    event.preventDefault();
    clearErrors();
    const stallId = stallInput.value;
    const status = statusInput.value;
    const date = document.getElementById("inspectionDate").value;
    const scoreText = document.getElementById("inspectionScore").value;
    const score = Number(scoreText);
    const validUntil = document.getElementById("validUntil").value;
    const remarks = document.getElementById("inspectionRemarks").value.trim();
    let valid = true;
    if (!stallId) { document.getElementById("inspectionStallError").textContent = "Select a food stall."; valid = false; }
    if (!date) { document.getElementById("inspectionDateError").textContent = "Choose the inspection date."; valid = false; }
    if (status === "Completed") {
      if (scoreText === "" || !Number.isFinite(score) || score < 0 || score > 100) { document.getElementById("inspectionScoreError").textContent = "Enter a score from 0 to 100."; valid = false; }
      if (!validUntil || validUntil <= date) { document.getElementById("validUntilError").textContent = "Validity must end after the inspection date."; valid = false; }
      if (remarks.length < 10) { document.getElementById("inspectionRemarksError").textContent = "Write at least 10 characters of inspection remarks."; valid = false; }
    }
    if (!valid) return;

    const records = HC.getInspections();
    const existingId = document.getElementById("inspectionId").value;
    const record = {
      id: existingId || `INS-${Date.now().toString().slice(-8)}`,
      stallId,
      status,
      scheduledDate: date,
      date: status === "Completed" ? date : "",
      score: status === "Completed" ? score : null,
      grade: status === "Completed" ? gradeFromScore(score) : "",
      remarks: status === "Completed" ? remarks : "",
      validUntil: status === "Completed" ? validUntil : ""
    };
    const updated = existingId ? records.map((candidate) => candidate.id === existingId ? record : candidate) : [record, ...records];
    HC.saveData(HC.KEYS.inspections, updated);
    const message = document.getElementById("inspectionMessage");
    message.textContent = status === "Completed" ? `Inspection completed. ${HC.hygieneText(record.grade)} was issued.` : "Inspection scheduled successfully.";
    message.hidden = false;
    renderRecords();
    window.setTimeout(clearForm, 1100);
  });

  updateCompletedFields();
  renderRecords();
});
