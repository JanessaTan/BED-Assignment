/* Student ID- S10274395 */
/* Student Name: Than Thar Wint Htal */


document.addEventListener("DOMContentLoaded", function() {

const CUISINES = {
Chinese:{
overview:"Chinese food uses wok cooking with rice or noodles.",
dishes:["Chicken Rice","Char Kway Teow","Dumplings"],
hygiene:["Separate raw & cooked food","Clean work area regularly"]
}
};

let accepted = false;

// Elements
const tenantName = document.getElementById("tenantName");
const stallNumber = document.getElementById("stallNumber");
const hawkerCenter = document.getElementById("hawkerCenter");
const cuisineType = document.getElementById("cuisineType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const monthlyRent = document.getElementById("monthlyRent");
const deposit = document.getElementById("deposit");
const paymentMethod = document.getElementById("paymentMethod");
const tenantEmail = document.getElementById("tenantEmail");

const agreeCheckbox = document.getElementById("agreeCheckbox");
const acceptBtn = document.getElementById("acceptBtn");
const downloadBtn = document.getElementById("downloadPdf");
const cancelBtn = document.getElementById("cancelBtn");

const cuisineOverview = document.getElementById("cuisineOverview");
const popularDishes = document.getElementById("popularDishes");
const hygieneTips = document.getElementById("hygieneTips");

const signature = document.getElementById("signature");
const clearSignatureBtn = document.getElementById("clearSignature");

cuisineType.addEventListener("change",loadCuisine);
loadCuisine();


// ---------- Signature ----------
const ctx = signature ? signature.getContext("2d") : null;
let drawing=false;

signature.addEventListener("mousedown",()=>{
drawing=true;
ctx.beginPath();
});

signature.addEventListener("mouseup",()=>drawing=false);

signature.addEventListener("mousemove",(e)=>{
if(!drawing) return;

ctx.lineWidth=2;
ctx.lineCap="round";
ctx.lineTo(e.offsetX,e.offsetY);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(e.offsetX,e.offsetY);
});

clearSignatureBtn.addEventListener("click",()=>{
ctx.clearRect(0,0,signature.width,signature.height);
});

// ---------- Validation ----------
function validate(){
return tenantName.value &&
stallNumber.value &&
hawkerCenter.value &&
startDate.value &&
endDate.value &&
monthlyRent.value &&
deposit.value &&
paymentMethod.value &&
tenantEmail.value;
}

function updateAccept(){
acceptBtn.disabled = !(validate() && agreeCheckbox.checked);
}

document.querySelectorAll("input,select").forEach(el=>{
el.addEventListener("input",updateAccept);
el.addEventListener("change",updateAccept);
});

agreeCheckbox.addEventListener("change",updateAccept);

// ---------- Accept ----------
acceptBtn.addEventListener("click",()=>{
accepted=true;
downloadBtn.disabled=false;
alert("Agreement Accepted");
});

// ---------- Cancel ----------
cancelBtn.addEventListener("click",()=>{
window.location.href="saleAnalytics.html";
});

// ---------- PDF ----------
downloadBtn.addEventListener("click",()=>{
if(!accepted) return;

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

doc.text("Rental Agreement",20,20);
doc.text("Tenant: "+tenantName.value,20,40);
doc.text("Stall: "+stallNumber.value,20,50);
doc.text("Rent: $"+monthlyRent.value,20,60);

doc.save("rental-agreement.pdf");
});

});