document.addEventListener("DOMContentLoaded", async function initialiseNeaInspections() {
    if (!HC.initPage("inspections", ["nea_officer"])) return;
    const form = document.getElementById("inspectionForm");
    const stallInput = document.getElementById("inspectionStall");

    // Populate stalls
    console.log(HC.stalls);
    stallInput.insertAdjacentHTML(
        "beforeend",
        HC.stalls.map(
            (stall) =>
                `<option value="${stall.StallID}">
                    ${HC.escapeHtml(stall.StallName)}
                </option>`
        ).join("")
    );
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
        const stallId = stallInput.value;
        const date = document.getElementById("inspectionDate").value;
        const scoreText = document.getElementById("inspectionScore").value;
        const score = Number(scoreText);
        const validUntil = document.getElementById("validUntil").value;
        const remarks = document.getElementById("inspectionRemarks").value.trim();

        let valid = true;

        if(!stallId){
            document.getElementById("inspectionStallError")
            .textContent = "Select a food stall.";
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
            OfficerID: "O001",
            InspectionRemark: remarks
        };

        try {
            const response = await fetch(
                "/api/hygiene",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
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