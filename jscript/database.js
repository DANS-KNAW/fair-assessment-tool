    <!-- ===================================================== -->
    <!-- ================== DATABASE SCRIPTS ================= -->
    <!-- ===================================================== -->
        var HOST = 'DANS';
        var DOWNLOAD_FILE_NAME = 'assessment_answers.csv';

        /* ---------------- Initialize database ---------------- */
        firebase.initializeApp(firebaseConfig);

        /* ---------------- Write to database ---------------- */

        function submit_page() {
            if (valid_input()) {
                firebase.auth().signInAnonymously()
                .then(function() {
                    let answers = get_answers();
                    writeToSheet(answers);
                })
                .catch(function(error) {
                    write_to_modal("SIGN IN", error.message + "  " +  error.code);
                });
            }
        }

        function writeToSheet(answers) {
            var hostRef = firebase.database().ref('/assessment tool answers/' + HOST);
            let m = JSON.parse(answers);
            hostRef.push(m, function(error) {
                if (error) {
                    write_to_modal("SUBMISSION", error.message);
                } else {
                    let submitted = "Answers were succesfully submitted into the database." + "<br><br>"
                    let advice = ""
//                    let advice = get_negative_answers().length > 0 ?
//                        "You had answered some questions with 'No'. If you want to see advice concerning these questions, please click " +
//                        "<a data-toggle='modal' onclick='show_advice_for_negative_answers()' style='color:blue' style='cursor:pointer'> here</a>. " +
//                        "When you print the assessment, you will also see this advice." + "<br><br>" : "";
                    let thanks = "Thank you for your participation!";
                    write_to_modal("SUBMISSION", submitted + advice + thanks);
                }
            })
        }

        /* ---------------- Download database ---------------- */
        function read_database() {
            let email = prompt("Your email\n (download is restricted to administrators) ", "");
            if (email) {
                let password = prompt("password", "");
                firebase.auth().signInWithEmailAndPassword(email, password)
                .then(function() {
                    download();
                 })
                 .catch(function(error) {
                    write_to_modal("SIGN IN", error.message + "  " +  error.code);
                });
            }
        }

        function download() {
            var answers = [];
            var ref = firebase.database().ref("assessment tool answers/");
            ref.on("value", function(snapshot) {
                snapshot.forEach(function(organizationSnapshot) {
                    organizationSnapshot.forEach(function(childSnapshot) {
                        var a = childSnapshot.val();
                        answers.push(organizationSnapshot.key + "," + a.date + "," +
                                        a.yq1 + "," + a.yq2 + "," + a.yq3 + "," +
                                        a.fq1 + "," + a.fq1i + "," + a.fq2 + "," + a.fq2i + "," + a.fq3 + "," + a.fq3i + "," +
                                        a.aq1 + "," + a.aq1i + "," + a.aq2 + "," + a.aq2i + "," +
                                        a.iq1 + "," + a.iq1i + "," +
                                        a.rq1 + "," + a.rq1i + "," + a.rq2 + "," + a.rq2i + "," + a.rq3 + "," + a.rq3i + "," + a.rq4 + "," + a.rq4i + "," + a.rq5 + "," + a.rq5i + "," +
                                        a.qq1 + "," + a.qq2 + "," + a.qq3 + "," + a.qq4
                                    );
                    });
                });
                downloadAnswers(answers);
            });
        }

        function downloadAnswers(answers) {
            var csv = 'Host, Date, Domain, Role, Organization, FQ1, FQ1-i, FQ2, FQ2-i, FQ3, FQ3-i, AQ1, AQ1-i, IQ1, IQ1-i, IQ2, IQ2-i, RQ1, RQ1-i, RQ2, RQ2-i, RQ3, RQ3-i, RQ4, RQ4-i, RQ5, RQ5-i, Not understandable, Missing metrics, General feedback, Awareness raised\n';
            answers.forEach(function(row) {
                csv += row + "\n";
            })
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            hiddenElement.target = '_blank';
            hiddenElement.download = DOWNLOAD_FILE_NAME;
            hiddenElement.click();
        }
