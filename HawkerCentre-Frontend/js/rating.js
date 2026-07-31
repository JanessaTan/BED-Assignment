document.addEventListener("DOMContentLoaded", function initialiseRatings() {
  if (!HC.initPage("feedback", ["customer", "guest"])) return;

  const stallSelect = document.getElementById("ratingStall");
  stallSelect.innerHTML = HC.stalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join("");
  stallSelect.value = HC.getQueryParameter("stall") || HC.resolveSelectedStall() || HC.stalls[0].id;

  function render() {
    const stallId = stallSelect.value;
    const sort = document.getElementById("reviewSort").value;
    let reviews = HC.loadData(HC.KEYS.ratings, []).filter((review) => review.stallId === stallId);
    reviews.sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      return new Date(b.date) - new Date(a.date);
    });
    const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    const counts = [5, 4, 3, 2, 1].map((value) => ({ value, count: reviews.filter((review) => review.rating === value).length }));
    document.getElementById("ratingOverview").innerHTML = `
      <div class="row-between"><div><span class="stat-value">${average.toFixed(1)}</span><span class="rating-stars" aria-label="${average.toFixed(1)} out of 5 stars">★★★★★</span><p class="muted">${reviews.length} review${reviews.length === 1 ? "" : "s"}</p></div>
      <div class="rating-breakdown">${counts.map((entry) => `<div class="breakdown-row"><span>${entry.value} stars</span><div class="progress"><span style="width:${reviews.length ? (entry.count / reviews.length) * 100 : 0}%"></span></div><strong>${entry.count}</strong></div>`).join("")}</div></div>`;
    document.getElementById("reviewEmpty").hidden = reviews.length > 0;
    document.getElementById("reviewList").innerHTML = reviews.map((review) => `<article class="card review-card"><div class="row-between"><strong>${HC.escapeHtml(review.user)}</strong><span class="rating-stars" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span></div><blockquote>“${HC.escapeHtml(review.comment)}”</blockquote><p class="muted">${HC.formatDate(review.date)}</p></article>`).join("");
  }

  stallSelect.addEventListener("change", render);
  document.getElementById("reviewSort").addEventListener("change", render);
  document.getElementById("ratingForm").addEventListener("submit", function submitRating(event) {
    event.preventDefault();
    const value = Number(document.getElementById("ratingValue").value);
    const comment = document.getElementById("ratingComment").value.trim();
    const error = document.getElementById("ratingError");
    error.textContent = "";
    if (!value || comment.length < 5) {
      error.textContent = "Choose a rating and write at least 5 characters.";
      return;
    }
    const reviews = HC.loadData(HC.KEYS.ratings, []);
    reviews.unshift({
      id: `rating-${Date.now()}`,
      stallId: stallSelect.value,
      user: HC.getCurrentUser()?.name || "Guest",
      rating: value,
      food: value,
      service: value,
      comment,
      date: new Date().toISOString().slice(0, 10)
    });
    HC.saveData(HC.KEYS.ratings, reviews);
    HC.saveData(HC.KEYS.feedback, reviews);
    event.currentTarget.reset();
    HC.showToast("Your rating was saved.");
    render();
  });
  render();
});
