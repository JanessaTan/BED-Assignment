document.addEventListener("DOMContentLoaded", function initialiseRatings() {
  if (!HC.initPage("feedback", ["customer", "guest"])) return;

  const stallSelect = document.getElementById("ratingStall");
  const categoryFilter = document.getElementById("ratingCategoryFilter");
  const subcategoryFilter = document.getElementById("ratingSubcategoryFilter");
  const reviewSort = document.getElementById("reviewSort");
  const ratingForm = document.getElementById("ratingForm");

  let feedbackRecords = [];
  let stallNameById = {};

  loadStallsIntoRatingDropdown(stallSelect).then(function initialiseFeedbackList(stalls) {
    stallNameById = {};

    stalls.forEach((stall) => {
      stallNameById[stall.StallID] = stall.StallName;
    });

    loadFeedbackForCurrentFilters();
  });

  stallSelect.addEventListener("change", loadFeedbackForCurrentFilters);
  categoryFilter.addEventListener("change", render);
  subcategoryFilter.addEventListener("change", render);
  reviewSort.addEventListener("change", render);

  ratingForm.addEventListener("submit", async function submitRating(event) {
    event.preventDefault();

    const stallId = stallSelect.value;
    const category = document.getElementById("ratingCategory").value;
    const subcategory = document.getElementById("ratingSubcategory").value;
    const value = Number(document.getElementById("ratingValue").value);
    const comment = document.getElementById("ratingComment").value.trim();
    const error = document.getElementById("ratingError");
    const currentUser = HC.getCurrentUser();

    const customerID =
      currentUser?.customerID ||
      (currentUser?.id === "user-customer-demo" ? "CU000" : null);

    error.textContent = "";

    if (!stallId) {
      error.textContent = "Choose a stall.";
      return;
    }

    if (!category) {
      error.textContent = "Choose a feedback category.";
      return;
    }

    if (!subcategory) {
      error.textContent = "Choose a feedback subcategory.";
      return;
    }

    if (!value || comment.length < 5) {
      error.textContent = "Choose a rating and write at least 5 characters.";
      return;
    }

    if (!customerID) {
      error.textContent = "Please log in as a customer before submitting a rating.";
      return;
    }

    const feedbackData = {
      Category: category,
      Subcategory: subcategory,
      FbkComment: comment,
      FbkRating: value,
      CustomerID: customerID,
      StallID: stallId
    };

    try {
      await submitRatingToFeedbackApi(feedbackData);
      
      ratingForm.reset();
      HC.showToast("Your rating was submitted.");
      await loadFeedbackForCurrentFilters();
      
    } catch (error) {
      console.error("Error submitting rating:", error);
      document.getElementById("ratingError").textContent =
        error.message || "Unable to submit rating.";
    }
  });

  async function loadFeedbackForCurrentFilters() {
    const stallId = stallSelect.value;

    try {
      feedbackRecords = await loadFeedbackFromApi(stallId);
      render();

    } catch (error) {
      console.error("Error loading ratings:", error);
      feedbackRecords = [];
      render();
    }
  }

  function render() {
    const sort = reviewSort.value;
    const selectedCategory = categoryFilter.value;
    const selectedSubcategory = subcategoryFilter.value;

    let reviews = feedbackRecords.slice();

    if (selectedCategory) {
      reviews = reviews.filter((review) => review.Category === selectedCategory);
    }

    if (selectedSubcategory) {
      reviews = reviews.filter((review) => review.Subcategory === selectedSubcategory);
    }

    reviews.sort((a, b) => {
      if (sort === "highest") return Number(b.FbkRating) - Number(a.FbkRating);
      if (sort === "lowest") return Number(a.FbkRating) - Number(b.FbkRating);
      return new Date(b.FbkDateTime) - new Date(a.FbkDateTime);
    });

    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.FbkRating), 0) / reviews.length
      : 0;

    const counts = [5, 4, 3, 2, 1].map((value) => ({
      value,
      count: reviews.filter((review) => Number(review.FbkRating) === value).length
    }));

    document.getElementById("ratingOverview").innerHTML = `
      <div class="row-between">
        <div>
          <span class="stat-value">${average.toFixed(1)}</span>
          <span class="rating-stars" aria-label="${average.toFixed(1)} out of 5 stars">★★★★★</span>
          <p class="muted">${reviews.length} review${reviews.length === 1 ? "" : "s"}</p>
        </div>
        <div class="rating-breakdown">
          ${counts.map((entry) => `
            <div class="breakdown-row">
              <span>${entry.value} stars</span>
              <div class="progress">
                <span style="width:${reviews.length ? (entry.count / reviews.length) * 100 : 0}%"></span>
              </div>
              <strong>${entry.count}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("reviewEmpty").hidden = reviews.length > 0;

    document.getElementById("reviewList").innerHTML = reviews.map((review) => {
      const rating = Number(review.FbkRating);
      const filledStars = "★".repeat(rating);
      const emptyStars = "☆".repeat(5 - rating);
      const stallName = stallNameById[review.StallID] || review.StallID || "Unknown stall";

      return `
        <article class="card review-card">
          <div class="row-between">
            <strong>${HC.escapeHtml(review.CustName || "Customer")}</strong>
            <span class="rating-stars" aria-label="${rating} out of 5 stars">${filledStars}${emptyStars}</span>
          </div>
          <p class="muted">${HC.escapeHtml(stallName)}</p>
          <p class="muted">${HC.escapeHtml(review.Category)} · ${HC.escapeHtml(review.Subcategory)}</p>
          <blockquote>“${HC.escapeHtml(review.FbkComment)}”</blockquote>
          <p class="muted">${HC.formatDate(review.FbkDateTime, true)}</p>
        </article>
      `;
    }).join("");
  }
});

async function loadStallsIntoRatingDropdown(stallSelect) {
  try {
    const response = await fetch("/api/stalls?limit=100");
    const result = await response.json();

    let stalls = [];

    if (response.ok) {
      stalls = normaliseRatingStallApiResult(result);
    }

    if (!response.ok || stalls.length === 0) {
      console.warn(
        "Stall API failed or returned no usable stalls. Using fallback stall list.",
        result
      );

      stalls = getFallbackRatingStalls();
    }

    renderRatingStallOptions(stallSelect, stalls);

    return stalls;

  } catch (error) {
    console.error("Error loading stalls:", error);

    const stalls = getFallbackRatingStalls();

    renderRatingStallOptions(stallSelect, stalls);

    return stalls;
  }
}

function normaliseRatingStallApiResult(result) {
  const rawStalls = Array.isArray(result)
    ? result
    : result.data || result.rows || [];

  return rawStalls
    .map((stall) => {
      return {
        ...stall,
        StallID:
          stall.StallID ||
          stall.stallId ||
          stall.stall_id ||
          stall.id,
        StallName:
          stall.StallName ||
          stall.name ||
          stall.stallName ||
          stall.StallDesc ||
          "Unnamed stall"
      };
    })
    .filter((stall) => stall.StallID && stall.StallName);
}

function renderRatingStallOptions(stallSelect, stalls) {
  stallSelect.innerHTML = `<option value="">All stalls</option>`;

  stallSelect.insertAdjacentHTML(
    "beforeend",
    stalls
      .map((stall) => {
        return `<option value="${HC.escapeHtml(stall.StallID)}">${HC.escapeHtml(stall.StallName)}</option>`;
      })
      .join("")
  );

  const selectedStall = HC.getQueryParameter("stall");

  if (selectedStall) {
    stallSelect.value = selectedStall;
  }
}

function getFallbackRatingStalls() {
  const frontendStallToDatabaseStall = {
    "clementi-chicken-rice": "S001",
    "clementi-kopi": "S010",
    "bedok-laksa": "S019",
    "bedok-veg": "S018",
    "tampines-nasi": "S002",
    "jurong-prata": "S004",
    "toa-payoh-fish": "S005",
    "chinatown-dessert": "S009"
  };

  return HC.stalls.map((stall) => {
    return {
      StallID: frontendStallToDatabaseStall[stall.id] || stall.id,
      StallName: stall.name
    };
  });
}

function normaliseRatingStallApiResult(result) {
  const rawStalls = Array.isArray(result)
    ? result
    : result.data || result.rows || [];

  return rawStalls
    .map((stall) => {
      return {
        ...stall,
        StallID:
          stall.StallID ||
          stall.stallId ||
          stall.stall_id ||
          stall.id,
        StallName:
          stall.StallName ||
          stall.name ||
          stall.stallName ||
          stall.StallDesc ||
          stall.description ||
          "Unnamed stall"
      };
    })
    .filter((stall) => stall.StallID && stall.StallName);
}

function renderRatingStallOptions(stallSelect, stalls) {
  stallSelect.innerHTML = `<option value="">All stalls</option>`;

  stallSelect.insertAdjacentHTML(
    "beforeend",
    stalls
      .map((stall) => {
        return `<option value="${HC.escapeHtml(stall.StallID)}">${HC.escapeHtml(stall.StallName)}</option>`;
      })
      .join("")
  );

  const selectedStall = normaliseSelectedRatingStallId(
    HC.getQueryParameter("stall")
  );

  if (selectedStall) {
    stallSelect.value = selectedStall;
  }
}

function normaliseSelectedRatingStallId(stallId) {
  const frontendStallToDatabaseStall = {
    "clementi-chicken-rice": "S001",
    "clementi-kopi": "S010",
    "bedok-laksa": "S019",
    "bedok-veg": "S018",
    "tampines-nasi": "S002",
    "jurong-prata": "S004",
    "toa-payoh-fish": "S005",
    "chinatown-dessert": "S009"
  };

  return frontendStallToDatabaseStall[stallId] || stallId;
}

function getFallbackRatingStalls() {
  return [
    { StallID: "S001", StallName: "Ah Huat Chicken Rice" },
    { StallID: "S002", StallName: "Mak Cik Nasi Lemak" },
    { StallID: "S003", StallName: "Burger Lab" },
    { StallID: "S004", StallName: "Delight Curry Rice" },
    { StallID: "S005", StallName: "Noodle Express" },
    { StallID: "S006", StallName: "Popiah Corner" },
    { StallID: "S007", StallName: "Satay Hut" },
    { StallID: "S008", StallName: "Raj Briyani" },
    { StallID: "S009", StallName: "Western Delight" },
    { StallID: "S010", StallName: "Pho Saigon" },
    { StallID: "S011", StallName: "Chinatown Dim Sum" },
    { StallID: "S012", StallName: "Prawn Noodle House" },
    { StallID: "S013", StallName: "Tokyo Ramen" },
    { StallID: "S014", StallName: "Warung Kita" },
    { StallID: "S015", StallName: "Sushi Go" },
    { StallID: "S016", StallName: "Laksa Express" },
    { StallID: "S017", StallName: "Chicken Rice Deluxe" },
    { StallID: "S018", StallName: "Veggie Life" },
    { StallID: "S019", StallName: "Laksa King" },
    { StallID: "S020", StallName: "Mee Siam House" },
    { StallID: "S021", StallName: "Roti John Stall" },
    { StallID: "S022", StallName: "Thosai Corner" },
    { StallID: "S023", StallName: "Claypot Master" },
    { StallID: "S024", StallName: "BBQ Express" },
    { StallID: "S025", StallName: "Seafood Paradise" },
    { StallID: "S026", StallName: "Chicken Curry Corner" },
    { StallID: "S027", StallName: "Fish Soup House" },
    { StallID: "S028", StallName: "Amoy Chicken Rice" },
    { StallID: "S029", StallName: "Amoy Nasi Lemak" },
    { StallID: "S030", StallName: "Beef Noodle House" },
    { StallID: "S031", StallName: "Curry Puff Corner" },
    { StallID: "S032", StallName: "Claypot Delights" }
  ];
}

async function loadFeedbackFromApi(stallId) {
  const endpoint = stallId
    ? `/api/feedback/stall_id/${encodeURIComponent(stallId)}`
    : "/api/feedback";

  const response = await fetch(endpoint);
  const result = await response.json();

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to load feedback.");
  }

  return result || [];
}

async function submitRatingToFeedbackApi(feedbackData) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(feedbackData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to submit rating.");
  }

  return result;
}