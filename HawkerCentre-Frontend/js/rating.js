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
    const response = await fetch("/api/stalls");
    const stalls = await response.json();

    if (!response.ok) {
      throw new Error("Failed to load stalls.");
    }

    stallSelect.innerHTML = `<option value="">All stalls</option>`;

    stallSelect.insertAdjacentHTML(
      "beforeend",
      stalls
        .map((stall) => `<option value="${HC.escapeHtml(stall.StallID)}">${HC.escapeHtml(stall.StallName)}</option>`)
        .join("")
    );

    const selectedStall = HC.getQueryParameter("stall");

    if (selectedStall) {
      stallSelect.value = selectedStall;
    }

    return stalls;

  } catch (error) {
    console.error("Error loading stalls:", error);
    stallSelect.innerHTML = `<option value="">Unable to load stalls</option>`;
    return [];
  }
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