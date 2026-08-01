document.addEventListener("DOMContentLoaded", function initialiseFeedback() {
  if (!HC.initPage("feedback", ["customer", "guest"])) return;

  const stallSelect = document.getElementById("stallId");
  stallSelect.insertAdjacentHTML("beforeend", HC.stalls.map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`).join(""));
  const selectedStall = HC.getQueryParameter("stall");
  if (selectedStall) stallSelect.value = selectedStall;

  const categorySelect = document.getElementById("category");

  const subcategorySelect = document.getElementById("subcategory");

  const comments = document.getElementById("comments");
  comments.addEventListener("input", function updateCharacterCount() {
    document.getElementById("characterCount").textContent = `${comments.value.length} / 400`;
  });

  function setError(id, text) {
    document.getElementById(id).textContent = text;
  }

  document.getElementById("feedbackForm").addEventListener("submit", function submitFeedback(event) {
    event.preventDefault();
    ["stallIdError", "ratingError", "categoryError", "subcategoryError",  "commentsError"].forEach((id) => setError(id, ""));
    const stallId = stallSelect.value;
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const rating = Number(document.getElementById("rating").value);
    const comment = comments.value.trim();
    let valid = true;

    if (!stallId) {
      setError("stallIdError", "Select the stall you visited.");
      valid = false;
    }
    if (!rating) {
      setError("categoryError", "Give a rating.");
      valid = false;
    }
    if (!category) {
      setError("subcategoryError", "Select the stall you visited.");
      valid = false;
    }
    if (!subcategory) {
      setError("stallIdError", "Select the stall you visited.");
      valid = false;
    }
    if (comment.length < 10) {
      setError("commentsError", "Write at least 10 characters of useful feedback.");
      valid = false;
    }
    if (!valid) return;

    const user = HC.getCurrentUser();
    const feedback = HC.loadData(HC.KEYS.feedback, []);
    feedback.unshift({
      id: `review-${Date.now()}`,
      stallId,
      user: user?.name || "Guest",
      rating,
      category,
      subcategory,
      comment,
      date: new Date().toISOString().slice(0, 10)
    });
    HC.saveData(HC.KEYS.feedback, feedback);
    HC.saveData(HC.KEYS.ratings, feedback);
    event.currentTarget.reset();
    document.getElementById("characterCount").textContent = "0 / 400";
    const message = document.getElementById("feedbackMessage");
    message.textContent = "Thank you. Your feedback was saved in this browser.";
    message.hidden = false;
  });
});
