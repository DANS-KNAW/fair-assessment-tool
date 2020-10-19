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
            ['Y', [49, 6, 9]],
            ['F', [2, 2, 2]],
            ['A', [2, 2]],
            ['I', [2]],
            ['R', [2, 2, 2, 2]],
            ['Q', [10, 0, 0, 5]]
        ])
        var number_fair_questions = get_number_of_fair_questions();
        var short_answers = new Map([
            <!-- Shortened answers to make downloaded data more readable -->
            ['yq2.3', 'Research support'],
            ['yq3.5', 'eInfrastructure'],
        ])


        /* -------------------- Initialize -------------------- */

        $('document').ready(initialise);

        function initialise() {
            update();
            $("#introduction-text").html(document.getElementById("introduction").innerHTML);
            hide_intention_questions();
            document.getElementById("score-and-guidance").style.display = "none"
            document.getElementById("introduction").style.display = "none"
            document.getElementById("texts").style.display = "none"
            document.getElementById("print-button").style.display = "none";
        }

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        function hide_intention_questions() {
            for (let [letter, questions] of fields) {
                if (letters.includes(letter)) {
                    for(let i = 0; i < questions.length; i++) {
                        <!-- question is e.g. "fq1" -->
                        let question = letter.toLowerCase() + "q" + (i + 1).toString();
                        document.getElementById(question + "-i").style.display = "none"
                    }
                }
            }
        }

        /* ----------- Include another html file ----------- */

        function includeHTML(id) {
            var elmnt = document.getElementById(id)
            var file = elmnt.getAttribute("html-file");
            var xhttp = new XMLHttpRequest();
            xhttp.open("GET", file, true);
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    elmnt.innerHTML = this.responseText;
                }
            }
            xhttp.send();
        }

        /* ----------- Toggle domains dropdown menu ----------- */

        function domain_toggle() {
            $('.dropdown-submenu a.dropdown-title').on("click", function(d){
                $(this).parent().siblings().children().filter('ul').hide();
                $(this).next('ul').toggle();
                d.stopPropagation();
                d.preventDefault();
            });
        }

        /* ----------- Get, check, disable and enable elements/values ----------- */

        function get_value(element) {
            return checked(element) ? parseFloat(document.getElementById(element).value) : 0.0;
        }

        function checked(element) {
            return (document.getElementById(element) !=null && document.getElementById(element).checked) ? 1 : 0;
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
            var more = document.getElementById(id_prefix + "-more");
            var additional = document.getElementById(id_prefix + "-additional");
            if (more && additional) {
                more.style.display = "block";
                additional.style.display = "none";
            }
            var contents = document.getElementById(id_prefix + "-contents").innerHTML;
            write_to_modal(title, contents);
        }

        function show_additional_text(question) {
            document.getElementById(question + "-more").style.display = "none";
            document.getElementById(question + "-additional").style.display = "block";
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
        function update_F(question) {
            show_intention_question(question);
            show_info_tip(question);
            update_print_letters(question);
            set_to_default_color(question);
        }

        /* ----------------------- A ----------------------- */
        function update_A(question) {
            show_intention_question(question);
            show_info_tip(question);
            update_print_letters(question);
            set_to_default_color(question);
        }

        /* ------------------------ I ----------------------- */
        function update_I(question) {
            show_intention_question(question);
            show_info_tip(question);
            update_print_letters(question);
            set_to_default_color(question);
        }

        /* ----------------------- R ------------------------ */
        function update_R(question) {
            show_intention_question(question);
            show_info_tip(question);
            update_print_letters(question);
            set_to_default_color(question);
        }

        /* ----------------------- Y ----------------------- */
        function update_Y(question) {
            set_to_default_color(question);
        }

        /* ----------------------- Q ----------------------- */
        function update_Q(question) {
            set_to_default_color(question);
        }

        /* --------------------- Intention --------------------- */
        function update_intention(question) {
            set_to_default_color(question);
        }

        function show_info_tip(question) {
            if (question != null) {
                if (checked(question + ".2")) {
                    // question -> info_tip_key e.g. fq1 -> F-i-1
                    info_tip_key = (question.charAt(0).toUpperCase() + question.slice(1)).replace("q", "-i-")
                    show_modal(info_tip_key)
                }
            }
        }

        function show_intention_question(question) {
            if (question != null) {
                document.getElementById(question + "-i").style.display = "block";
            }
        }

        function update_print_letters(question) {
            if (question != null) {
                let percent = Math.floor(get_score() / number_fair_questions * 10) * 10;
                for (let letter of letters) {
                    document.getElementById(("image-print-" + letter).toLowerCase()).src = "images/print/" + letter + "_" + percent + ".jpg"
                }
            }
        }

        function set_to_default_color(question) {
            if (question != null) {
                // question -> question_key e.g. fq1 -> F-i-1-title
                question_key = (question.charAt(0).toUpperCase() + question.slice(1)).replace("q", "-i-") + "-title";
                document.getElementById(question_key).style.color = "#000000";
            }
        }

        /* ------------------ Domains --------------- */

        function show_domains() {
            let domains = get_answers_for_a_question("yq1", get_number_of_domain_answers())
            $("#show-domains").html(domains);
            document.getElementById("Y-i-1-title").style.color = "#000000";
        }

        function get_number_of_domain_answers() {
            for (let [letter, questions] of fields) {
                if (letter == "Y")
                    return questions[0]
            }
        }

        /* ------------------ Validate answers --------------- */

        function valid_input() {
            let unanswered = false;
            for (let [letter, questions] of fields) {
                for(let i = 0; i < questions.length; i++) {
                    let number_of_answers = questions[i];
                    let answered = false;
                    let intention_questions_answered = 0;
                    <!-- question is e.g. "fq1" -->
                    let question = letter.toLowerCase() + "q" + (i + 1).toString();
                    for (let j = 0; j < number_of_answers; j++) {
                        <!-- choice is e.g. "fq1.2" -->
                        let choice = question + "." + (j + 1).toString();
                        if (checked(choice)) {
                            answered = true;
                            if (letters.includes(letter)) {
                                intention_questions_answered = intention_questions_answer(question)
                            }
                        }
                    }
                    if (!answered && !excluded(question)) {
                        <!-- question_key is e.g. "F-i-1-title" -->
                        question_key = letter + "-i-" + (i + 1).toString() + "-title";
                        document.getElementById(question_key).style.color = "red";
                        unanswered = true;
                    }
                    if (answered && intention_questions_answered < 0) {
                        <!-- question_key is e.g. "F-i-1-title" -->
                        question_key = letter + "-i-" + (i + 1).toString() + "-title";
                        document.getElementById(question_key).style.color = "red";
                        unanswered = true;
                    }
                }
            }
            if (unanswered) {
                write_to_modal("Some questions are not answered yet.", "They are marked in <font color='red'>red</font>.");
                return false;
            }
            return true;
        }

        function excluded(question) {
            <!-- questions excluded from validation -->
            return question == "qq1" || question == "qq2" ||question == "qq3";
        }

        function intention_questions_answer(question) {
            let intention_questions = document.getElementsByName(question + "-i");
            for (let i = 0; i < 5; i++) {
                if (intention_questions[i].checked) {
                    return intention_questions[i].value;
                }
            }
            return -1;
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
                    <!-- question is e.g. "fq1" -->
                    let question = letter.toLowerCase() + "q" + (i + 1).toString();
                    let number_of_answers = questions[i];
                    m.set(question, get_answers_for_a_question(question, number_of_answers));
                    if (letters.includes(letter)) {
                        m.set(question + "i", get_intention_answer_for_a_question(question, number_of_answers));
                    }
                }
            }
            <!-- set free text fields -->
            m.set("qq2", document.getElementById("qq2").value.replace(/(\n)+/g, " ").replace(/,/g, " ").replace(/;/g, " ").trim())
            m.set("qq3", document.getElementById("qq3").value.replace(/(\n)+/g, " ").replace(/,/g, " ").replace(/;/g, " ").trim())

            return JSON.stringify(Object.fromEntries(m));
        }

        function get_answers_for_a_question(question, number_of_answers) {
            let answers = "";
            let first = true;
            for (let j = 0; j < number_of_answers; j++) {
                <!-- choice is e.g. "fq1.2" -->
                let choice = question + "." + (j + 1).toString();
                if (checked(choice)) {
                    answers +=  (first ? "" : " AND ") + get_answer(choice);
                    first = false;
                }
            }
            return answers;
        }

        function get_answer(choice) {
            if (short_answers.has(choice)) {
                return short_answers.get(choice)
            } else {
                let answer = "l" + choice;
                return document.getElementById(answer).textContent.replace(/,/g, " ").trim();
            }
        }

        function get_intention_answer_for_a_question(question, number_of_answers) {
            let intention = "";
            for (let j = 0; j < number_of_answers; j++) {
                <!-- choice is e.g. "fq1.2" -->
                let choice = question + "." + (j + 1).toString();
                if (checked(choice)) {
                    intention = intention_questions_answer(question)
                }
            }
            return intention;
        }

        /* ------------------ Submit answers --------------- */

        function submit() {
            scrollToTop()
            if (valid_input()) {
                submit_page()
            }
        }

        function show_results() {
            document.getElementById("intro").style.display = "none";
            document.getElementById("score-and-guidance").style.display = "block";
            $("#score").html("Awareness score: " + get_score() + "/" + number_fair_questions);
            $("#score-text").html(get_score_text());
            if (get_score() < number_fair_questions) { $("#guidance").html(get_guidance_texts()); }
            else { document.getElementById("guidance-texts").style.display = "none"; }
            if (window.print) { document.getElementById("print-button").style.display = "block"; }
        }

        function get_score() {
            return number_fair_questions - get_negative_answers().length;
        }

        function get_score_text() {
            let score = get_score();
            if (score < 6) { return "Not sufficiently FAIR-Aware" }
            else if (score < 8) { return "Moderately FAIR-Aware" }
            else { return "Very FAIR-Aware" }
        }

        function get_guidance_texts() {
            let guidance = "";
            let negative = get_negative_answers();
            for(let question_key of negative) {
                let additional_text = "";
                let question = document.getElementById(question_key + "-title").textContent.bold();
                let basic_text = document.getElementById(question_key + "-default").innerHTML;
                let additional = document.getElementById(question_key + "-additional");
                if (additional) {additional_text = additional.innerHTML }
                let text = basic_text + additional_text;
                guidance += question + "\n" + text;
            }
            return guidance;
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
                            if (get_answer(choice).toLowerCase() == "no") {
                                question_key = letter + "-i-" + (i + 1).toString();
                                neg.push(question_key)
                            }
                        }
                    }
                }
            }
            return neg;
        }

        function get_number_of_fair_questions() {
            let number = 0;
            for (let [letter, questions] of fields) {
                if (letters.includes(letter)) {
                    number += questions.length
                }
            }
            return number;
        }

        function scrollToTop() {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        }

        /* ----------------------- Print --------------------- */

        function print_results() {
            document.getElementById("logos").style.display = "none"
            document.getElementById("icons").style.display = "none"
            document.getElementById("footer").style.display = "none"
            document.getElementById("for-administrators").style.display = "none"
            document.getElementById("image-f").style.display = "none"
            document.getElementById("image-a").style.display = "none"
            document.getElementById("image-i").style.display = "none"
            document.getElementById("image-r").style.display = "none"
            window.print();
            document.getElementById("logos").style.display = "block"
            document.getElementById("icons").style.display = "block"
            document.getElementById("footer").style.display = "block"
            document.getElementById("for-administrators").style.display = "block"
            document.getElementById("image-f").style.display = "block"
            document.getElementById("image-a").style.display = "block"
            document.getElementById("image-i").style.display = "block"
            document.getElementById("image-r").style.display = "block"
            update();
        }
