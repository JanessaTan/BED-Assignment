document.addEventListener("DOMContentLoaded", function initialiseFeedback() {
  if (!HC.initPage("feedback", ["customer", "guest"])) return;

  const stallSelect = document.getElementById("stallId");
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  const comments = document.getElementById("comments");
  const feedbackForm = document.getElementById("feedbackForm");

  // stallSelect.insertAdjacentHTML(
  //   "beforeend",
  //   HC.stalls
  //     .map((stall) => `<option value="${stall.id}">${HC.escapeHtml(stall.name)}</option>`)
  //     .join("")
  // );

  // const selectedStall = HC.getQueryParameter("stall");
  

  loadStallsIntoDropdown(stallSelect);

  comments.addEventListener("input", function updateCharacterCount() {
    document.getElementById("characterCount").textContent = `${comments.value.length} / 400`;
  });

  feedbackForm.addEventListener("submit", async function submitFeedback(event) {
    event.preventDefault();

    clearErrors();

    const stallId = stallSelect.value;
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const rating = Number(document.getElementById("rating").value);
    const comment = comments.value.trim();
    const currentUser = HC.getCurrentUser();
    const customerID = currentUser?.customerID;

    let valid = true;

    if (!stallId) {
      setError("stallIdError", "Select the stall you visited.");
      valid = false;
    }

    if (!rating) {
      setError("ratingError", "Give a rating.");
      valid = false;
    }

    if (!category) {
      setError("categoryError", "Select a feedback category.");
      valid = false;
    }

    if (!subcategory) {
      setError("subcategoryError", "Select a feedback subcategory.");
      valid = false;
    }

    if (comment.length < 10) {
      setError("commentsError", "Write at least 10 characters of useful feedback.");
      valid = false;
    }

    // if (!currentUser || !currentUser.id || currentUser.name === "Guest") {
    //   setError("stallIdError", "Please log in as a customer before submitting feedback.");
    //   valid = false;
    // }

    if (!customerID) {
      setError("stallIdError", "Please log in as a customer before submitting feedback.");
      valid = false;
    }

    if (!valid) return;

    // const feedbackData = {
    //   Category: category,
    //   Subcategory: subcategory,
    //   FbkComment: comment,
    //   FbkRating: rating,
    //   CustomerID: currentUser.id,
    //   StallID: stallId
    // };

    const feedbackData = {
      Category: category,
      Subcategory: subcategory,
      FbkComment: comment,
      FbkRating: rating,
      CustomerID: customerID,
      StallID: stallId
    };

    try {
      await submitFeedbackToApi(feedbackData);

      feedbackForm.reset();
      document.getElementById("characterCount").textContent = "0 / 400";

      const message = document.getElementById("feedbackMessage");
      message.textContent = "Thank you. Your feedback was submitted successfully.";
      message.hidden = false;

    } catch (error) {
      console.error("Error submitting feedback:", error);

      const message = document.getElementById("feedbackMessage");
      message.textContent = error.message || "Unable to submit feedback. Please try again.";
      message.hidden = false;
    }
  });
});

async function loadStallsIntoDropdown(stallSelect) {
  try {
    const response = await fetch("/api/stalls");
    const stalls = await response.json();

    if (!response.ok) {
      throw new Error("Failed to load stalls.");
    }

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

  } catch (error) {
    console.error("Error loading stalls:", error);
    setError("stallIdError", "Unable to load stalls.");
  }
}

async function submitFeedbackToApi(feedbackData) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(feedbackData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to submit feedback.");
  }

  return result;
}

function setError(id, text) {
  document.getElementById(id).textContent = text;
}

function clearErrors() {
  ["stallIdError", "ratingError", "categoryError", "subcategoryError", "commentsError"].forEach((id) => {
    setError(id, "");
  });
}