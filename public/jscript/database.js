var DOWNLOAD_FILE_NAME = "FAIRAware_results.csv";

/* ---------------- Submit to server ---------------- */

function submit_page() {
  document.getElementById("submit-button").style.display = "none";

  let answers = get_answers();
  let answersObj = JSON.parse(answers);

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

/* ---------------- Download from server ---------------- */

function read_database() {
  document.getElementById("download-id").value = "";
  document.getElementById("download-pw").value = "";
  document.getElementById("download-code").value = "";
  // Clicking Submit in this modal calls authenticate_and_download function
  $("#download-authorization").modal("show");
}

function authenticate_and_download() {
  let email = document.getElementById("download-id").value;
  let password = document.getElementById("download-pw").value;
  let code = document.getElementById("download-code").value;

  if (!email || !password || !code) {
    write_to_modal("VALIDATION ERROR", "Please fill in all fields");
    return;
  }

  fetch("/api/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, code }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message || "Download failed");
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.success && data.data) {
        downloadAnswers(data.data);
      } else {
        write_to_modal("DOWNLOAD ERROR", data.message || "No answers found");
      }
    })
    .catch((error) => {
      write_to_modal("DOWNLOAD ERROR", error.message);
    });
}

function downloadAnswers(answers) {
  var csv =
    "Host, Date, Code, Domain, Role, Organization, FQ1, FQ1-i, FQ2, FQ2-i, FQ3, FQ3-i, AQ1, AQ1-i, AQ2, AQ2-i, IQ1, IQ1-i, RQ1, RQ1-i, RQ2, RQ2-i, RQ3, RQ3-i, RQ4, RQ4-i, Not understandable, Missing metrics, General feedback, Awareness raised\n";

  answers.forEach(function (answer) {
    const row = [
      answer.host || "",
      answer.date || "",
      answer.cq1 || "",
      answer.yq1 || "",
      answer.yq2 || "",
      answer.yq3 || "",
      answer.fq1 || "",
      answer.fq1i || "",
      answer.fq2 || "",
      answer.fq2i || "",
      answer.fq3 || "",
      answer.fq3i || "",
      answer.aq1 || "",
      answer.aq1i || "",
      answer.aq2 || "",
      answer.aq2i || "",
      answer.iq1 || "",
      answer.iq1i || "",
      answer.rq1 || "",
      answer.rq1i || "",
      answer.rq2 || "",
      answer.rq2i || "",
      answer.rq3 || "",
      answer.rq3i || "",
      answer.rq4 || "",
      answer.rq4i || "",
      answer.qq1 || "",
      answer.qq2 || "",
      answer.qq3 || "",
      answer.qq4 || "",
    ]
      .map((val) => val.toString().replace(/,/g, " ").replace(/#/g, ""))
      .join(",");

    csv += row + "\n";
  });

  var hiddenElement = document.createElement("a");
  hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
  hiddenElement.target = "_blank";
  hiddenElement.download = DOWNLOAD_FILE_NAME;
  hiddenElement.click();
}
