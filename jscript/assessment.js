    <!-- ======================================================= -->
    <!-- ================== ASSESSMENT SCRIPTS ================= -->
    <!-- ======================================================= -->

        var letters = ["F", "A", "I", "R"]
        var fields = new Map([
            <!-- For each letter (or 'about you'/'feedback' question) an array where  -->
            <!-- the first item marks the first question, the second item the second question, etc. -->
            <!-- The value of the item is the number of possible answers to the respective question. -->
            <!-- For questions where the answer is given in free text, the value is 0. -->
            <!-- Notice: It is important to update this Map when questions are removed or added! -->
            ['Y', [14, 6, 9]],
            ['F', [2, 2, 3, 2, 3]],
            ['A', [5, 2, 2, 2]],
            ['I', [2, 2]],
            ['R', [2, 3, 2, 3, 3, 3]],
            ['Q', [14, 0, 0, 5]]
        ])
        var short_answers = new Map([
            <!-- Shortened answers to make downloaded data more readable -->
            ['fq5.1', 'Structured data'],
            ['fq5.2', 'Web service'],
            ['fq5.3', 'Not offered'],
            ['aq1.4', 'Closed access'],
            ['aq1.5', 'None'],
            ['rq5.3', 'Standard unknown'],
        ])

        /* -------------------- Initialize -------------------- */

        $('document').ready(initialise);

        function initialise() {
            update();
            $("#introduction-text").html(document.getElementById("introduction").innerHTML);
            document.getElementById("texts").style.display = "none"
            if(!window.print) {document.getElementById("print-button").style.display = "none"}
        }

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        /* ----------- Get, check, disable and enable elements/values ----------- */

        function get_value(element) {
            return checked(element) ? parseFloat(document.getElementById(element).value) : 0.0;
        }

        function checked(element) {
            return document.getElementById(element).checked ? 1 : 0;
        }

        function disable(elements) {
            for (let element of elements) {
                document.getElementById(element).checked = 0;
                document.getElementById("l" + element).style.color = "#C0C0C0";
            }
        }

        function enable(elements) {
            for (let element of elements) {
                document.getElementById("l" + element).style.color = "#000000";
            }
        }

        /* ----------- Show text in modal window ------------ */

        function show_modal(id_prefix) {
            var title = document.getElementById(id_prefix + "-title").textContent;
            var contents = document.getElementById(id_prefix + "-contents").innerHTML;
            write_to_modal(title, contents);
        }

        function write_to_modal(title, contents) {
            $("#modal-title").html(title);
            $("#modal-body").html(contents);
            $('#modal').modal('show');
        }

        /* ------------------ Update all ------------------- */

        function update() {
            /*
            In all of the following variable names, if there is a prefix of [fair], it stands for
            Findable, Accessible, Interoperable and Reusable respectively. Letter q refers to a question,
            and letter a to an answer. For example, '#aq1' is a reference to question 1 for Accessible.
            */
            update_F();
            update_A();
            update_I();
            update_R();
        }

        /* ----------------------- F ----------------------- */
        function update_F() {
            if (checked("fq5.1") || checked("fq5.2")) {
                disable(["fq5.3"]);
            }
             else {
                enable(["fq5.3"]);
            }
        }

        /* ----------------------- A ----------------------- */
        function update_A() {
            if (!checked("aq1.2")) {
                disable(["aq2.1", "aq2.2"]);
            } else {
                enable(["aq2.1", "aq2.2"]);
            }
            if (!checked("aq1.3")) {
                disable(["aq3.1", "aq3.2"]);
            }else {
                enable(["aq3.1", "aq3.2"]);
            }
        }

        /* ------------------------ I ----------------------- */
        function update_I() {
        }

        /* ----------------------- R ----------------------- */
        function update_R() {
            if (!checked("rq1.1")) {
                disable(["rq2.1", "rq2.2", "rq2.3"]);
            } else {
                enable(["rq2.1", "rq2.2", "rq2.3"]);
            }
        }

        /* ---------------------------- Print --------------------------- */

        function print_page() {
            document.getElementById("logos").style.display = "none"
            document.getElementById("icons").style.display = "none"
            document.getElementById("for-administrators").style.display = "none"
            window.print();
            document.getElementById("logos").style.display = "block"
            document.getElementById("icons").style.display = "block"
            document.getElementById("for-administrators").style.display = "block"
            update();
        }

        /* ------------------ Validate answers --------------- */

        function valid_input() {
            let text = "";
            for (let [letter, questions] of fields) {
                for(let i = 0; i < questions.length; i++) {
                    let number_of_answers = questions[i];
                    let answered = false;
                    <!-- question is e.g. "fq1" -->
                    let question = letter.toLowerCase() + "q" + (i + 1).toString();
                    for (let j = 0; j < number_of_answers; j++) {
                        <!-- choice is e.g. "fq1.2" -->
                        let choice = question + "." + (j + 1).toString();
                        if (checked(choice))
                            answered = true;
                    }
                    if (!answered && !excluded(question)) {
                        <!-- question_key is e.g. "F-i-1-title" -->
                        question_key = letter + "-i-" + (i + 1).toString() + "-title";
                        text +=  document.getElementById(question_key).textContent + "<br><br>";
                    }
                }
            }
            if (!(text === "")) {
                write_to_modal("Following questions are not yet answered:", text);
                return false;
            }
            return true;
        }

        function excluded(question) {
            <!-- questions embargoed access / restricted access excluded from validation? -->
            return question == "aq2" && !embargoed_access() || question == "aq3" && !restricted_access() || question == "rq2" && !content_descriptions() || answer_not_required(question);
        }

        function embargoed_access() {
            return checked("aq1.2")
        }

        function restricted_access() {
            return checked("aq1.3")
        }

        function content_descriptions() {
            return checked("rq1.1")
        }

        function answer_not_required(question) {
            return question == "qq1" || question == "qq2" ||question == "qq3"
        }

        /* ------------------ Retrieve answers --------------- */

        function get_answers() {
            let m = new Map();
            var today = new Date();
            var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            m.set("date", date)
            for (let [letter, questions] of fields) {
                for(let i = 0; i < questions.length; i++) {
                    let answers = "";
                    <!-- question is e.g. "fq1" -->
                    let question = letter.toLowerCase() + "q" + (i + 1).toString();
                    let number_of_answers = questions[i];
                    var first = true;
                    for (let j = 0; j < number_of_answers; j++) {
                        <!-- choice is e.g. "fq1.2" -->
                        let choice = question + "." + (j + 1).toString();
                        if (checked(choice)) {
                            answers +=  (first ? "" : " AND ") + get_answer(choice);
                            first = false;
                        }
                    }
                    m.set(question, answers);
                }
            }
            <!-- set free text fields -->
            m.set("qq2", document.getElementById("qq2").value.replace(/(\n)+/g, " ").trim())
            m.set("qq3", document.getElementById("qq3").value.replace(/(\n)+/g, " ").trim())

            return JSON.stringify(Object.fromEntries(m));
        }

        function get_answer(choice) {
            if (short_answers.has(choice)) {
                return short_answers.get(choice)
            } else {
                let answer = "l" + choice;
                return document.getElementById(answer).textContent.replace(/,/g, " ").trim().substr(0, 50);
            }
        }
