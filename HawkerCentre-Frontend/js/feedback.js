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
    console.log(stallId);
    const category = categorySelect.value;
    console.log(category);
    const subcategory = subcategorySelect.value;
    console.log(subcategory);
    const rating = Number(document.getElementById("rating").value);
    console.log(rating);
    const comment = comments.value.trim();
    console.log(comment);
    const currentUser = HC.getCurrentUser();
    console.log(currentUser);
    const customerID = currentUser?.userId;
    console.log(customerID);

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
    const response = await fetch("/api/stalls?limit=100");
    const result = await response.json();

    let stalls = [];

    if (response.ok) {
      stalls = normaliseStallApiResult(result);
    }

    if (!response.ok || stalls.length === 0) {
      console.warn(
        "Stall API failed or returned no usable stalls. Using fallback stall list.",
        result
      );

      stalls = getFallbackStalls();
    }

    stallSelect.innerHTML = `<option value="">Select a stall</option>`;

    stallSelect.insertAdjacentHTML(
      "beforeend",
      stalls
        .map((stall) => {
          return `<option value="${HC.escapeHtml(stall.StallID)}">${HC.escapeHtml(stall.StallName)}</option>`;
        })
        .join("")
    );

    const selectedStall = normaliseSelectedStallId(
      HC.getQueryParameter("stall")
    );

    if (selectedStall) {
      stallSelect.value = selectedStall;
    }

  } catch (error) {
    console.error("Error loading stalls:", error);

    const stalls = getFallbackStalls();

    stallSelect.innerHTML = `<option value="">Select a stall</option>`;

    stallSelect.insertAdjacentHTML(
      "beforeend",
      stalls
        .map((stall) => {
          return `<option value="${HC.escapeHtml(stall.StallID)}">${HC.escapeHtml(stall.StallName)}</option>`;
        })
        .join("")
    );

    const selectedStall = normaliseSelectedStallId(
      HC.getQueryParameter("stall")
    );

    if (selectedStall) {
      stallSelect.value = selectedStall;
    }
  }
}

function normaliseStallApiResult(result) {
  const rawStalls = Array.isArray(result)
    ? result
    : result.data || result.rows || [];

  return rawStalls
    .map((stall) => {
      return {
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

function normaliseSelectedStallId(stallId) {
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

function getFallbackStalls() {
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