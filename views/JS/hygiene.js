(function () {
  // Get DOM element
  const hygieneContent = document.getElementById("hygieneContent");

  // Read stall from URL query string
  const stallId = new URLSearchParams(window.location.search).get("stall");

  // Store all data as JSON in one object (for easy display)
  async function loadHygiene() {
     try {
          const response = await fetch(`/stalls/${stallId}/hygiene`);

          if (!response.ok) {
              hygieneContent.innerHTML = "<p>No hygiene record found.</p>";
              return;
          }

          const record = await response.json();

          hygieneContent.innerHTML = `
              <section class="hygiene-section">
                  <table class="hygiene-table">
                      <thead>
                          <tr>
                              <th>Inspection Date</th>
                              <th>Valid Until</th>
                              <th>Current Grade</th>
                          </tr>
                     </thead>
                      <tbody>
                          <tr>
                              <td>${record.InspectionDate}</td>
                              <td>${record.GradeExpiry}</td>
                              <td class="grade grade-${record.HygieneGrade}">
                                  ${record.HygieneGrade}
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </section>
          `;
      } catch (err) {
          console.error(err);
          hygieneContent.innerHTML = "<p>Error loading hygiene record.</p>";
      }
  }

  // Call the function when the page loads
  loadHygiene();
  })();

//   // Render all / selected stall tables into Hygiene.html
//   function renderHygiene() {
//     let html = "";

//     const keys = Object.keys(stallsToRender);

//     // If there are no records, display an error message
//     if (keys.length === 0) {
//       hygieneContent.innerHTML = "<p>No hygiene records available.</p>";
//       return;
//     }

//     // Define stall info and load the HTML
//     for (let k = 0; k < keys.length; k++) {
//       const id = keys[k];
//       const stall = stallsToRender[id];

//       if (!stall || !stall.records || stall.records.length === 0) {
//         html += `
//           <section class="hygiene-section">
//             <h3 class="hygiene-stall-title">${stall ? stall.name : "Stall"}</h3>
//             <p>No hygiene records available.</p>
//           </section>
//         `;
//       } else {
//         html += buildRow(stall.name, stall.records);
//       }
//     }

//     hygieneContent.innerHTML = html;
//   }

//   renderHygiene();
// })();
