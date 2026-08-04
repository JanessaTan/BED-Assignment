document.addEventListener("DOMContentLoaded", async function initialiseNeaInspections() {
    if (!HC.initPage("inspections", ["nea_officer"])) return;
    const form = document.getElementById("inspectionForm");
    const stallInput = document.getElementById("inspectionStall");

    let stalls = [];

    try {
        const response = await fetch("/api/stalls");
        if(!response.ok){
        throw new Error("Failed to load stalls");
    }

    const data = await response.json();
    stalls = data.data;
    stallInput.insertAdjacentHTML("beforeend", stalls.map(stall =>`<option value="${stall.stallId}">${HC.escapeHtml(stall.name)}</option>`).join(""));

    } catch(error){
        console.error(error);
    }

    document.getElementById("inspectionDate").value =
        new Date().toISOString().slice(0, 10);

    function gradeFromScore(score) {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        return "D";
    }

    function clearErrors() {
        [
            "inspectionStallError",
            "inspectionDateError",
            "inspectionScoreError",
            "validUntilError",
            "inspectionRemarksError"
        ].forEach((id) => {
            const element = document.getElementById(id);
            if(element){
                element.textContent = "";
            }
        });
    }

    form.addEventListener("submit", async function saveInspection(event) {

        event.preventDefault();
        clearErrors();
        let valid = true;
        const stallId = stallInput.value;
        const date = document.getElementById("inspectionDate").value;
        const scoreText = document.getElementById("inspectionScore").value;
        const score = Number(scoreText);
        const validUntil = document.getElementById("validUntil").value;
        const remarks = document.getElementById("inspectionRemarks").value.trim();

        if (!stallId) {
            document.getElementById("inspectionStallError").textContent =
                "Select a stall.";

            valid = false;
        }

        if(!date){
            document.getElementById("inspectionDateError")
            .textContent = "Choose inspection date.";
            valid = false;
        }

        if(
            scoreText === "" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 100
        ){
            document.getElementById("inspectionScoreError")
            .textContent = "Enter a score from 0 to 100.";

            valid = false;
        }

        if(!validUntil || validUntil <= date){

            document.getElementById("validUntilError")
            .textContent =
            "Validity must end after inspection date.";
            valid = false;
        }

        if(remarks.length < 10){
            document.getElementById("inspectionRemarksError")
            .textContent =
            "Write at least 10 characters.";
            valid = false;
        }

        if(!valid) return;



        const inspection = {
            StallID: stallId,
            InspectionDate: date,
            HygieneGrade: gradeFromScore(score),
            GradeExpiry: validUntil,
            InspectionRemark: remarks
        };

        try {
            const response = await fetch(
                "/api/hygiene",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        "Authorization": `Bearer ${HC.getAuthToken()}`
                    },
                    body:JSON.stringify(inspection)
                }
            );

            if(!response.ok){
                throw new Error("Failed to create inspection");
            }
            const message = document.getElementById("inspectionMessage");
            message.textContent = `Inspection completed. Grade ${inspection.HygieneGrade} issued.`;
            message.hidden = false;
            form.reset();
            document.getElementById("inspectionDate").value = new Date().toISOString().slice(0,10);
        } catch(error){

            console.error(error);
            alert(
                "Unable to save inspection."
            );
        }
    });
});