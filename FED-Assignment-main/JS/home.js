document.addEventListener("DOMContentLoaded", function(){

  const lauPaSat = [1.2804, 103.8503];

  const map = L.map('map', {
    scrollWheelZoom: false
  }).setView(lauPaSat, 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(lauPaSat)
    .addTo(map)
    .bindPopup("<b>Lau Pa Sat</b><br>18 Raffles Quay, Singapore")
    .openPopup();

});

/* Banner Navigation */

function goContact(){
  window.location.href = "Contact.html";
}

function goDummy(){
  window.location.href = "Dummy.html";
}
