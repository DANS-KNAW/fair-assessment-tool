/* ---------------- Submit to server ---------------- */

function submit_page() {
  document.getElementById("submit-button").style.display = "none";

  const answers = get_answers();
  const answersObj = JSON.parse(answers);

  fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(answersObj),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message || "Submission failed");
        });
      }
      return response.json();
    })
    .then((data) => {
      show_results();
    })
    .catch((error) => {
      write_to_modal("SUBMISSION ERROR", error.message);
      document.getElementById("submit-button").style.display = "block";
    });
}
