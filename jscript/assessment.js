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
            ['C', [0]],
            ['Y', [62, 6, 9]],
            ['F', [2, 2, 2]],
            ['A', [2, 2]],
            ['I', [2]],
            ['R', [2, 2, 2, 2]],
            ['Q', [10, 0, 0, 5]]
        ])
        var willingness_max = 5
        var number_fair_questions = get_number_of_fair_questions();
        var total_willingness_score = get_total_willingness_score();
        var short_answers = new Map([
            <!-- Shortened answers to make downloaded data more readable -->
            ['yq2.3', 'Research support'],
            ['yq3.5', 'eInfrastructure'],
        ])


        /* -------------------- Initialize -------------------- */

        $(document).ready(initialise);
        $(document).ready(function(){ $('[rel=tooltip]').tooltip({ trigger: "hover" }); });

        function initialise() {
            $("#introduction-text").html(document.getElementById("introduction").innerHTML);
            hide_elements(["yq2.6.1", "yq3.9.1", "score-and-guidance", "introduction", "texts", "print-button"])
            hide_intention_questions();
        }

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        function hide_elements(elements_to_hide) {
            for (let element of elements_to_hide) {
                hide_element(element)
            }
        }

        function show_elements(elements_to_show) {
            for (let element of elements_to_show) {
                show_element(element)
            }
        }

        function hide_intention_questions() {
            for (let [letter, questions] of fields) {
                if (letters.includes(letter)) {
                    for(let i = 0; i < questions.length; i++) {
                        <!-- question is e.g. "fq1" -->
                        let question = letter.toLowerCase() + "q" + (i + 1).toString();
                        hide_element(question + "-i")
                    }
                }
            }
        }

        function hide_element(element) {
            document.getElementById(element).style.display = "none"
        }

        function show_element(element) {
            document.getElementById(element).style.display = "block"
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

        function show_modal(id_prefix, modal_nr=1) {
            var title = document.getElementById(id_prefix + "-title").textContent;
            var more = document.getElementById(id_prefix + "-more");
            var additional = document.getElementById(id_prefix + "-additional");
            if (more && additional) {
                more.style.display = "block";
                additional.style.display = "none";
            }
            var contents = document.getElementById(id_prefix + "-contents").innerHTML;
            write_to_modal(title, contents, modal_nr);
        }

        function show_additional_text(question) {
            hide_element(question + "-more");
            show_element(question + "-additional");
        }

        function write_to_modal(title, contents, modal_nr) {
            $(`#modal-title-${modal_nr}`).html(title);
            $(`#modal-body-${modal_nr}`).html(contents);
            $(`#modal-${modal_nr}`).modal('show');
        }

        /* --------------------- Update -------------------- */
        function update(question) {
            show_intention_question(question);
            show_info_tip(question);
            update_print_letters(question);
            set_to_default_color(question);
        }

        /* --------------- Update About You ---------------- */
        function update_Y(question) {
            set_to_default_color(question);
            update_other(["yq2.6", "yq3.9"])
        }

        function update_other(questions) {
            for (let question of questions) {
                if (checked(question)) {
                    show_element(question + ".1")
                } else {
                    hide_element(question + ".1")
                }
            }
        }

        /* ---------------- Update Feedback ---------------- */
        function update_Q(question) {
            set_to_default_color(question);
        }

        /* ------------------- Intention ------------------- */
        function update_intention(question) {
            update_print_letters(question);
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
                let awareness_percent = Math.floor(get_awareness_score() / number_fair_questions * 10) * 10;
                let willingness_percent = Math.floor(get_willingness_score() / total_willingness_score * 10) * 10;
                for (let letter of letters) {
                    document.getElementById(("awareness-" + letter).toLowerCase()).src = "images/print/blue/" + letter + "_" + awareness_percent + ".jpg"
                    document.getElementById(("willingness-" + letter).toLowerCase()).src = "images/print/yellow/" + letter + "_" + willingness_percent + ".jpg"
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
            return question == "cq1" || question == "qq1" || question == "qq2" ||question == "qq3";
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
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
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
            m.set("cq1", document.getElementById("cq1").value.trim())
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
                if ((choice == "yq2.6" || choice == "yq3.9") && document.getElementById(choice + ".1").value.trim() != "") {
                    // get value from the Other input field
                    return document.getElementById(choice + ".1").value.replace(/,/g, " ").replace(/;/g, " ").trim()
                } else {
                    let answer = "l" + choice;
                    return document.getElementById(answer).textContent.replace(/,/g, " ").replace(/;/g, " ").trim();
                }
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
            $("#contents :input").attr("disabled", true);
            hide_elements(["intro", "contents", "summary-responses"])
            show_element("score-and-guidance")
            $("#score-text-awareness").html(get_awareness_score_text() + " (" + get_awareness_score() + "/" + number_fair_questions + ")");
            $("#score-text-willingness").html(get_willingness_score_text() + " (" + get_willingness_score() + "/" + total_willingness_score + ")");
            if (get_awareness_score() < number_fair_questions) { $("#guidance").html(get_guidance_texts()); }
            else { hide_element("guidance-texts"); }
            if (window.print) { show_element("print-button"); }
        }

        function show_responses() {
            show_elements(["summary-responses", "contents"])
            hide_element("show-summary")
        }

        function get_awareness_score() {
            return number_fair_questions - get_negative_answers().length;
        }

        function get_awareness_score_text() {
            let score = get_awareness_score();
            if (score < 6) { return "Low" }
            else if (score < 8) { return "Moderate" }
            else { return "High" }
        }

        function get_willingness_score() {
            let count = 0
            for (let [letter, questions] of fields) {
                if (letters.includes(letter)) {
                    for(let i = 0; i < questions.length; i++) {
                        let intention = letter.toLowerCase() + "q" + (i + 1).toString();
                        for (let j = 0; j < willingness_max; j++) {
                            let choice = intention + "." + (j + 1).toString() + "-i";
                            if (checked(choice)) {
                                count += parseInt(get_answer(choice));
                            }
                        }
                    }
                }
            }
            return count;
        }

        function get_willingness_score_text() {
            let score = get_willingness_score();
            if (score < 30) { return "Low" }
            else if (score < 40) { return "Moderate" }
            else { return "High" }
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

        function get_total_willingness_score() {
            let total_score = 0;
            for (let [letter, questions] of fields) {
                if (letters.includes(letter)) {
                    total_score += questions.length * willingness_max
                }
            }
            return total_score;
        }

        function scrollToTop() {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        }

        /* ----------------------- Print --------------------- */

        function print_results() {
            hide_elements(["logos", "icons", "footer", "for-administrators", "image-f", "image-a", "image-i", "image-r", "show-summary"]);
            window.print();
            show_elements(["logos", "icons", "footer", "for-administrators", "image-f", "image-a", "image-i", "image-r", "show-summary"]);
        }

        /* --------------------- Social media ------------------- */

        var social_media = function( media ) {
            let url = "";
            switch(media) {
                case "twitter":
                    url = "https://twitter.com/intent/tweet?text="
                    break
                case "linkedin":
                    url = "https://www.linkedin.com/shareArticle?mini=true&url=https://fairaware.dans.knaw.nl"
                    break
                case "whatsapp":
                    url = "https://wa.me/?text="
                    break
                default:
            }
            text = (media == "linkedin") ? "" : "I just used #FAIRAwareTool to assess and increase my knowledge on the #FAIR data principles! Try it out for yourself here: https://fairaware.dans.knaw.nl/";
            if (media == "twitter") text = text + "\n\n@DANS_knaw_nwo | @FAIRsFAIR_eu | #FAIRAware";
            dimensions = (media =="whatsapp") ? "width=1200,height=800" : "width=600,height=600"
            window.open(url + encodeURIComponent(text), "_blank", dimensions)
        }

