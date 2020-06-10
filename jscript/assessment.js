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
            ['F', [2, 2, 2]],
            ['A', [2, 2, 2]],
            ['I', [2]],
            ['R', [2, 2, 2, 2, 2]],
            ['Q', [14, 0, 0, 5]]
        ])

        /* -------------------- Initialize -------------------- */

        $('document').ready(initialise);

        function initialise() {
            update();
            $("#introduction-text").html(document.getElementById("introduction").innerHTML);
            document.getElementById("print-advice").style.display = "none"
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
        }

        /* ----------------------- A ----------------------- */
        function update_A() {
        }

        /* ------------------------ I ----------------------- */
        function update_I() {
        }

        /* ----------------------- R ----------------------- */
        function update_R() {
        }

        /* ---------------------------- Print --------------------------- */

        function print_page() {
            document.getElementById("logos").style.display = "none"
            document.getElementById("icons").style.display = "none"
            document.getElementById("footer").style.display = "none"
            document.getElementById("for-administrators").style.display = "none"
//            if (add_advice_texts().length != 0) {document.getElementById("print-advice").style.display = "block"};
            window.print();
            document.getElementById("logos").style.display = "block"
            document.getElementById("icons").style.display = "block"
            document.getElementById("footer").style.display = "block"
            document.getElementById("for-administrators").style.display = "block"
            document.getElementById("print-advice").style.display = "none"
            update();
        }

        function add_advice_texts() {
            let advices = "";
            let negative = get_negative_answers();
            for(let question_key of negative) {
                let question = document.getElementById(question_key + "-title").textContent.bold();
                let advice = document.getElementById(question_key + "-advice").innerHTML;
                advices += question + "\n" + advice;
            }
            if (advices.length != 0) {$("#print-advice-contents").html(advices);}
            return advices;
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
            <!-- questions excluded from validation -->
            return question == "qq1" || question == "qq2" ||question == "qq3";
        }

        /* ------------------ Retrieve answers --------------- */

        function get_answers() {
            let m = new Map();
            neg = new Map();
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

        function get_negative_answers() {
            let neg = []
            for (let [letter, questions] of fields) {
                for(let i = 0; i < questions.length; i++) {
                    let question = letter.toLowerCase() + "q" + (i + 1).toString();
                    let number_of_answers = questions[i];
                    for (let j = 0; j < number_of_answers; j++) {
                        let choice = question + "." + (j + 1).toString();
                        if (checked(choice)) {
                            if (get_answer(choice) == "No") {
                                question_key = letter + "-i-" + (i + 1).toString();
                                neg.push(question_key)
                            }
                        }
                    }
                }
            }
            return neg;
        }

        function get_answer(choice) {
            let answer = "l" + choice;
            return document.getElementById(answer).textContent.replace(/,/g, " ").trim().substr(0, 50);
        }
