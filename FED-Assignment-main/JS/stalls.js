// (function () {

//   const stallsEl = document.getElementById('stallList');


//   function loadStalls() {

//     stallsEl.innerHTML = '';

//     LOCAL_STALLS.forEach(s => {

//       const card = document.createElement('div');
//       card.className = 'stall-card';

//       card.innerHTML = `
//         <div class="stall-top">
//           <h3>${s.name}</h3>
//           <span class="stall-hours">
//             Operating hours: ${s.hours}
//           </span>
//         </div>

//         <div class="stall-desc">
//           ${s.name} specialises in ${s.cuisine}. 
//           Rated ⭐ ${s.rating}.
//         </div>

//         <div class="stall-actions">
//           <a class="btn primary" href="Menu.html?stall=${s.id}">
//             View Menu
//           </a>

//           <a class="btn secondary" href="rating.html?stall=${s.id}">
//             Ratings
//           </a>

//           <a class="btn muted" href="Hygiene.html?stall=${s.id}">
//             Hygiene
//           </a>
//         </div>
//       `;

//       stallsEl.appendChild(card);

//     });
//   }

//   loadStalls();

// })();

(function () {

    const stallsEl = document.getElementById('stallList');


    async function loadStalls() {

        try {

            const response = await fetch("/api/stalls");

            const stalls = await response.json();

            stallsEl.innerHTML = "";


            stalls.forEach(s => {

                const card = document.createElement('div');

                card.className = 'stall-card';


                card.innerHTML = `
                    <div class="stall-top">
                        <h3>${s.StallName}</h3>
                    </div>

                    <div class="stall-desc">
                        ${s.StallDesc}
                    </div>


                    <div class="stall-actions">

                        <a class="btn primary"
                           href="Menu.html?stall=${s.StallID}">
                           View Menu
                        </a>


                        <a class="btn secondary"
                           href="rating.html?stall=${s.StallID}">
                           Ratings
                        </a>


                        <a class="btn muted"
                           href="Hygiene.html?stall=${s.StallID}">
                           Hygiene
                        </a>

                    </div>
                `;


                stallsEl.appendChild(card);

            });


        } catch(error) {

            console.error(error);

            stallsEl.innerHTML =
            "<p>Unable to load stalls.</p>";

        }

    }


    loadStalls();


})();