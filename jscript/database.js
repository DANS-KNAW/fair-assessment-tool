    <!-- ===================================================== -->
    <!-- ================== DATABASE SCRIPTS ================= -->
    <!-- ===================================================== -->
        var HOST = 'DANS';
        var DOWNLOAD_FILE_NAME = 'FAIRAware_results.csv';

        /* ---------------- Initialize database ---------------- */
        if(typeof firebaseConfig != 'undefined') {
            firebase.initializeApp(firebaseConfig);
        }

        /* ---------------- Write to database ---------------- */

        function submit_page() {
            if(typeof firebaseConfig === 'undefined') {
                show_results();
            } else {
                document.getElementById("submit-button").style.display = "none";
                firebase.auth().signInAnonymously()
                .then(function() {
                    let answers = get_answers();
                    if (writeToSheet(answers)) {
                        show_results();
                    }
                })
                .catch(function(error) {
                    write_to_modal("SIGN IN", error.message + "  " +  error.code);
                    document.getElementById("submit-button").style.display = "block";
                });
            }
        }

        function writeToSheet(answers) {
            var hostRef = firebase.database().ref('/assessment tool answers/' + HOST);
            let m = JSON.parse(answers);
            hostRef.push(m, function(error) {
                if (error) {
                    write_to_modal("SUBMISSION", error.message);
                    document.getElementById("submit-button").style.display = "block";
                    return false;
                }
            })
            return true;
        }

        /* ---------------- Download database ---------------- */
        function read_database() {
            document.getElementById("download-id").value = "";
            document.getElementById("download-pw").value = "";
            document.getElementById("download-code").value = "";
            // Clicking Submit in this modal calls authenticate_and_download function
            $('#download-authorization').modal('show');
        }

        function authenticate_and_download() {
            let userid = document.getElementById("download-id").value;
            let pw = document.getElementById("download-pw").value;
            let code = document.getElementById("download-code").value;
            if (userid) {
                firebase.auth().signInWithEmailAndPassword(userid, pw)
                .then(function() {
                    download(code);
                 })
                 .catch(function(error) {
                    write_to_modal("SIGN IN", error.message + "  " +  error.code);
                });
            }
        }

        function download(code) {
            let answers = [];
            let ref = firebase.database().ref("assessment tool answers/");
            ref.on("value", function(snapshot) {
                snapshot.forEach(function(organizationSnapshot) {
                    organizationSnapshot.forEach(function(childSnapshot) {
                        var a = childSnapshot.val();
                        if (code == "downloadall" ||  (a.cq1 == code && code != "")) {
                            answers.push(organizationSnapshot.key + "," + a.date + "," +
                                            a.cq1 + "," +
                                            a.yq1 + "," + a.yq2 + "," + a.yq3 + "," +
                                            a.fq1 + "," + a.fq1i + "," + a.fq2 + "," + a.fq2i + "," + a.fq3 + "," + a.fq3i + "," +
                                            a.aq1 + "," + a.aq1i + "," + a.aq2 + "," + a.aq2i + "," +
                                            a.iq1 + "," + a.iq1i + "," +
                                            a.rq1 + "," + a.rq1i + "," + a.rq2 + "," + a.rq2i + "," + a.rq3 + "," + a.rq3i + "," + a.rq4 + "," + a.rq4i + "," +
                                            a.qq1 + "," + a.qq2 + "," + a.qq3 + "," + a.qq4
                                        );
                        }
                    });
                });
                downloadAnswers(answers);
            });
        }

        function downloadAnswers(answers) {
            var csv = 'Host, Date, Code, Domain, Role, Organization, FQ1, FQ1-i, FQ2, FQ2-i, FQ3, FQ3-i, AQ1, AQ1-i, AQ2, AQ2-i, IQ1, IQ1-i, RQ1, RQ1-i, RQ2, RQ2-i, RQ3, RQ3-i, RQ4, RQ4-i, Not understandable, Missing metrics, General feedback, Awareness raised\n';
            answers.forEach(function(row) {
                csv += row.replace("#", "") + "\n";     // "#" causes an error
            })
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            hiddenElement.target = '_blank';
            hiddenElement.download = DOWNLOAD_FILE_NAME;
            hiddenElement.click();
        }
