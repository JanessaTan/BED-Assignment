/* Student ID- S10274395 */
/* Student Name: Than Thar Wint Htal */

// Hawkwe Center - Crowd Level Chart JS//

(function(){

  // ===== 1. Crowd Data (demo) =====
  // Each array = crowd levels for 7 time slots
  const crowdData = {
    chinese: [2,9,3.5,4.5,6,8.5,1],
    indian:  [3,6,5,7,8,4,2],
    malay:   [1,4,6,5,7,3,2],
    thai:    [2,5,4,6,8,7,3],
    drink:   [5,6,7,8,6,5,4],
    western: [3,5,4,6,7,5,3]
  };

  //Stall names for display
  const stallNames = {
    chinese: "Chinese Cuisine",
    indian: "Indian Cuisine",
    malay: "Malay Cuisine",
    thai: "Thai Cuisine",
    drink: "Drink Store",
    western: "Western Cuisine"
  };

  //Get chart DOM elements
  const chartTitle = document.getElementById("chart-title");
  const chartBars = document.getElementById("chart-bars");

  // ===== 2. Function to render chart =====
  function renderChart(stall){
    // Update chart title
    chartTitle.textContent = "Average Crowd Level of " + stallNames[stall];

    // Clear previous bars
    chartBars.innerHTML = "";

    // Time labels for bars
    const hours = ["10am","12pm","2pm","4pm","6pm","8pm","10pm"];

    // Loop through each crowd value
    crowdData[stall].forEach((value, index) => {

      // Create Bar
      const bar = document.createElement("div");
      bar.classList.add("hc-bar");
      bar.style.setProperty("--v", value);
      bar.setAttribute("aria-label", `${hours[index]} crowd level ${value}`);
      
      // Add Hour Lable
      const label = document.createElement("span");
      label.classList.add("hc-bar__label");
      label.textContent = hours[index];
      
      // Add Value Label
      const val = document.createElement("span");
      val.classList.add("hc-bar__value");
      val.textContent = value;

      // Append lables to bar
      bar.appendChild(label);
      bar.appendChild(val);

      // Append bar to chart
      chartBars.appendChild(bar);
    });
  }

  // ===== 3. Click Event on Stall Titles =====
  const stallElements = document.querySelectorAll(".hc-card__title.clickable");

  stallElements.forEach(titleEl => {
    titleEl.addEventListener("click", function(){

      // Get stall type from parent card data attribute
      const stall = this.closest(".hc-card").dataset.stall;
      renderChart(stall);
    });
  });

  // ===== 4. Load default chart =====
  renderChart("chinese");

})();