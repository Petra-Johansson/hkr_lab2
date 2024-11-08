document.addEventListener("DOMContentLoaded", () => {
    const quizForm = document.getElementById("quiz-form");
    const questionForm = document.getElementById("question-form");

    if (quizForm) {
        quizForm.setAttribute("novalidate", "true");
    }
    if (questionForm) {
        questionForm.setAttribute("novalidate", "true");
    }
    const fNameInput = document.getElementById("f-name");
    const lNameInput = document.getElementById("l-name");
    const emailInput = document.getElementById("email");
    const quizFieldset = document.getElementById("quiz-fieldset");
    let questionData = [];

    leaderBoard();

    fNameInput.addEventListener("input", enableQuiz);
    lNameInput.addEventListener("input", enableQuiz);
    emailInput.addEventListener("input", enableQuiz);

    fetchQuestions();

    // Function to enable quiz fieldset if all fields are valid
    function enableQuiz() {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const emailValid = emailInput.checkValidity() && emailPattern.test(emailInput.value);
        const isInfoFormValid = fNameInput.checkValidity() &&
            lNameInput.checkValidity() &&
            emailValid;

        quizFieldset.disabled = !isInfoFormValid;
    }


    function fetchQuestions() {
        fetch('./questions.json')
            .then((res) => res.json())
            .then((data) => {
                //questionData = data.questions;
                const predefinedQuestions = data.questions;
                const userQuestions = JSON.parse(localStorage.getItem('userQuestions')) || [];
                questionData = [...predefinedQuestions, ...userQuestions];
                displayQuestions(questionData);
            })
            .catch((error) => console.log("Could not fetch data:", error));
    };

    // function to display errorMessages where needed
    function showErrorMessage(container, message) {
        let errorMessage = container.querySelector(".error-message");

        if (!errorMessage) {
            errorMessage = document.createElement("p");
            errorMessage.classList.add("error-message");
            container.appendChild(errorMessage);
        }

        errorMessage.innerText = message;
        errorMessage.style.display = "block";
    }

    function hideError(container) {
        const errorMessage = container.querySelector(".error-message");
        if (errorMessage) {
            errorMessage.style.display = "none";
        }
    }


    function maxSelection(maxSel, answersDiv) {
        const checkboxes = answersDiv.querySelectorAll(`input[type="checkbox"]`);

        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                const checkedBoxes = answersDiv.querySelectorAll(`input[type="checkbox"]:checked`);
                if (checkedBoxes.length > maxSel) {
                    // Uncheck the checkbox that was just checked
                    checkbox.checked = false;
                }
            });
        });
    }


    // show all questions and apply correct type of element
    function displayQuestions(questions) {
        const questionContainer = document.getElementById("question-container");
        questionContainer.innerHTML = '';

        // for each question fetched, we create a div called questionDiv 
        // that holds the question and answer-div's
        questions.forEach((questionObject, index) => {
            const questionDiv = document.createElement("div");
            questionDiv.classList.add("question");

            // create a H3 witch will be the question it self, append to questionDiv
            const questionTitle = document.createElement("h3");
            questionTitle.innerText = `${index + 1}. ${questionObject.question}`;
            questionDiv.appendChild(questionTitle);

            const requiredMarker = document.createElement("span");
            requiredMarker.classList.add("required-marker");
            requiredMarker.innerText = "*";
            questionTitle.appendChild(requiredMarker);

            // create the div to hold the answers
            const answersDiv = document.createElement("div");
            answersDiv.classList.add("answers");

            // add answers/options and display depending on type
            if (questionObject.options.length > 0) {
                // setting the input type. 
                // if "correct" answers is fetched as an array, set type to checkbox = multiple answers
                // if not, it's considerd a single choice questions = radiobutton
                const inputType = Array.isArray(questionObject.correct) ? "checkbox" : "radio";

                questionObject.options.forEach(option => {
                    const label = document.createElement("label");
                    const input = document.createElement("input");

                    input.type = inputType;
                    input.name = `question${index}`;
                    input.value = option;

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(option));
                    answersDiv.appendChild(label);
                });

                //check to see that checkbox-questions and radiobutton questions are filled in
                if (inputType === "checkbox") {
                    answersDiv.setAttribute("data-required", "true");
                    maxSelection(2, answersDiv);
                } else {
                    const firstInput = answersDiv.querySelector('input');
                    if (firstInput) firstInput.required = true;
                }

            } else {
                const input = document.createElement("input");
                input.type = "text";
                input.name = `question${index}`;
                input.placeholder = "Write your answer";
                input.required = true;
                answersDiv.appendChild(input);
            }
            // add question and answers div's to question-container
            questionDiv.appendChild(answersDiv);
            questionContainer.appendChild(questionDiv);
        });
    }

    function formValidation() {
        let isValid = true;

        if (!fNameInput.checkValidity()) {
            showErrorMessage(fNameInput.parentElement, "First name is required.");
            isValid = false;
        } else {
            hideError(fNameInput.parentElement);
        }
        if (!lNameInput.checkValidity()) {
            showErrorMessage(lNameInput.parentElement, "Last name is required.");
            isValid = false;
        } else {
            hideError(lNameInput.parentElement);
        }
        if (!emailInput.checkValidity()) {
            showErrorMessage(emailInput.parentElement, "Email is required.");
            isValid = false;
        } else {
            hideError(emailInput.parentElement);
        }

        if (isValid) {
            quizFieldset.disabled = false;
        } else {
            quizFieldset.disabled = true;
        }

        return isValid;
    }

    function quizValidation() {

        let isValid = true;
        const questions = document.querySelectorAll(".question");

        questions.forEach((question) => {
            const answersDiv = question.querySelector(".answers");
            const inputs = answersDiv.querySelectorAll("input");

            if (inputs.length === 0) return;

            const inputType = inputs[0].type;
            let answered = false;

            if (inputType === "checkbox") {
                const selected = Array.from(inputs).filter(input => input.checked);
                if (selected.length > 0 && selected.length <= 2) {
                    answered = true;
                }
            } if (inputType === "radio") {
                answered = Array.from(inputs).some(input => input.checked);

            } if (inputType === "text") {
                answered = inputs[0].value.trim() !== "";
            }
            if (!answered) {
                isValid = false;
            }
        });
        const errorContainer = document.getElementById("error-container");
        if (!isValid) {
            // Show a generic error message
            showErrorMessage(errorContainer, "Please make sure to answer all questions.");
        } else {
            hideError(errorContainer);
            console.log("Validation result:", isValid);
        }
        return isValid;
    }

    quizForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const infoForm = document.querySelector(".information-form");
        if (!infoForm.reportValidity()) {
            return;
        }
        // check that the information form is valid
        if (!formValidation()) {
            return;
        }
        // check that the quiz form is valid
        if (!quizValidation()) {
            return;
        }

        const userInfo = {
            firstName: fNameInput.value,
            lastName: lNameInput.value,
            email: emailInput.value,
        };

        // collect information about the users choices for each question
        const quizAnswers = {};
        const questions = document.querySelectorAll(".question");

        questions.forEach((question, index) => {
            const selectedOpts = [];
            const inputs = question.querySelectorAll("input");

            inputs.forEach((input) => {
                if (input.checked || (input.type === "text" && input.value.trim())) {
                    selectedOpts.push(input.value.trim());
                }
            });
            quizAnswers[`question${index + 1}`] = selectedOpts;
        });

        //save result from quiz in result-object
        const result = {
            userInfo: userInfo,
            answers: quizAnswers,
            timestamp: new Date().toISOString(),
        };

        // save the result in localStorage to be able to access and 
        //handle in showResult() 
        let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
        quizResults.push(result);
        localStorage.setItem("quizResults", JSON.stringify(quizResults));

        showResult(result);
    });


    // Show result of the quiz
    function showResult(result) {
        const resultContainer = document.querySelector(".result-container");
        let score = 0;
        let maxScore = 0;

        questionData.forEach((question, index) => {
            const usersAnswer = result.answers[`question${index + 1}`];
            const correctAnswer = question.correct;
            const questionDiv = document.querySelectorAll(".question")[index];
            const inputs = questionDiv.querySelectorAll("input");

            if (Array.isArray(correctAnswer)) {
                // For multiple-choice questions with multiple correct answers
                maxScore += correctAnswer.length; // Increment by the number of correct options
            } else {
                // For single-choice or text input questions
                maxScore += 1; // Increment by 1 for each question
            }

            if (Array.isArray(correctAnswer)) {

                // Handle multiple-choice questions (checkboxes)
                let multiChoiceScore = 0;
                if (usersAnswer) {
                    usersAnswer.forEach((answer) => {
                        if (correctAnswer.includes(answer)) {
                            multiChoiceScore++;
                        }
                    });
                }
                score += multiChoiceScore;

                // Mark correct and incorrect answers for checkboxes
                inputs.forEach(input => {
                    const label = input.parentElement;
                    if (correctAnswer.includes(input.value)) {
                        label.classList.add("correct");
                        if (input.checked) {
                            const correctFeedback = document.createElement("span");
                            correctFeedback.classList.add("feedback", "correct-ans");
                            correctFeedback.innerText = "Correct!";
                            label.appendChild(correctFeedback);
                        } else {
                            // Display the correct answer in italic if the user did not select it
                            label.style.fontStyle = "italic";
                            const correctDisplay = document.createElement("span");
                            correctDisplay.classList.add("correct-answer-display");
                            correctDisplay.style.fontStyle = "italic";
                            correctDisplay.innerText = " (Correct)";
                            label.appendChild(correctDisplay);
                        }
                    } else if (input.checked) {
                        label.classList.add("incorrect");
                        const incorrectFeedback = document.createElement("span");
                        incorrectFeedback.classList.add("feedback", "incorrect-ans");
                        incorrectFeedback.innerText = "Incorrect!";
                        label.appendChild(incorrectFeedback);
                    }
                });
            }

            inputs.forEach(input => {
                if (input.type === "text") {

                    const userInput = input.value.trim().toLowerCase();

                    const feedback = document.createElement("p");
                    feedback.classList.add("feedback");

                    const correctLower = typeof correctAnswer === 'string' ? correctAnswer.trim().toLowerCase() : '';

                    if (userInput === correctLower) {
                        input.classList.add("correct");
                        feedback.classList.add("correct-ans");
                        feedback.innerText = "Correct!";
                        score++;
                    } else {
                        input.classList.add("incorrect");
                        feedback.classList.add("incorrect-ans");
                        feedback.innerText = "Incorrect!";

                        const correctDisplay = document.createElement("span");
                        correctDisplay.classList.add("correct-ans");
                        correctDisplay.style.fontStyle = "italic";
                        correctDisplay.innerText = ` (Correct answer is: ${correctAnswer})`;
                        feedback.appendChild(correctDisplay);
                    }
                    input.parentElement.insertAdjacentElement("afterend", feedback);
                }
            });

            // Handle radio buttons
            inputs.forEach(input => {
                if (input.type === "radio") {
                    const label = input.parentElement;

                    if (input.value === correctAnswer) {
                        label.classList.add("correct");
                        if (input.checked) {
                            score++;
                            const correctFeedback = document.createElement("span");
                            correctFeedback.classList.add("feedback", "correct-ans");
                            correctFeedback.innerText = "Correct!";
                            label.appendChild(correctFeedback);
                        }
                        else {
                            label.style.fontStyle = "italic";
                            const correctDisplay = document.createElement("span");
                            correctDisplay.classList.add("correct-answer-display");
                            correctDisplay.style.fontStyle = "italic";
                            correctDisplay.innerText = " (Correct)";
                            label.appendChild(correctDisplay);
                        }

                    } else if (input.checked) {
                        label.classList.add("incorrect");
                        const incorrectFeedback = document.createElement("span");
                        incorrectFeedback.classList.add("feedback", "incorrect-ans");
                        incorrectFeedback.innerText = "Incorrect!";
                        label.appendChild(incorrectFeedback);
                    }
                }
            });
        }
        );
        //add the score to the result-object
        result.score = score;

        // update QuizResult with the score (to be able to show a leaderBoard / compare results)
        let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
        quizResults[quizResults.length - 1] = result;
        localStorage.setItem("quizResults", JSON.stringify(quizResults));

        resultContainer.innerHTML = `
            <h2>Good job!</h2>
            <h3>${result.userInfo.firstName} ${result.userInfo.lastName}</h3>
            <p>You got ${score} points out of maxmimum: ${maxScore}, by answering all ${questionData.length} questions!</p>
            <p>Date: ${new Date(result.timestamp).toLocaleDateString()}</p>
            `;

        //call leaderBoard function to update with new result
        leaderBoard();
        quizFieldset.disabled = true;

        const startOverButton = document.createElement("button");
        startOverButton.classList.add("restart-btn");
        startOverButton.innerText = "Start Over";
        startOverButton.addEventListener("click", () => {
            quizForm.reset();
            document.querySelector(".information-form").reset();
            quizFieldset.disabled = true;

            document.querySelectorAll(".feedback").forEach(feedback => feedback.remove());
            document.querySelectorAll(".correct, .incorrect").forEach(el => {
                el.classList.remove("correct", "incorrect");
            });
        });
        resultContainer.appendChild(startOverButton);
    }

    function leaderBoard() {
        let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];

        if (quizResults.length > 0) {
            const leaderBoard = document.getElementById("leader-board");
            leaderBoard.innerHTML = '';

            const leaderBoardTitle = document.createElement("h3");
            leaderBoardTitle.innerText = "Leaderboard";
            leaderBoard.appendChild(leaderBoardTitle);


            const boardDetails = document.createElement("p");
            boardDetails.classList.add("board-details");
            boardDetails.innerText = "Name";
            leaderBoard.appendChild(boardDetails);

            const scoreSpan = document.createElement("span");
            scoreSpan.innerText = "Score";
            boardDetails.appendChild(scoreSpan);

            // sort the result from highest to lowest score
            quizResults.sort((a, b) => b.score - a.score);

            quizResults.forEach((result, index) => {

                const userDiv = document.createElement("div");
                userDiv.classList.add("leaderboard-div");

                // adding an icon for the current leader
                if (index === 0) {
                    const firstPlaceIcon = document.createElement("i");
                    firstPlaceIcon.classList.add("fas", "fa-crown", "first-place-icon");
                    userDiv.appendChild(firstPlaceIcon);
                } else {
                    const personIcon = document.createElement("i");
                    personIcon.classList.add("fas", "fa-user", "person-icon");
                    userDiv.appendChild(personIcon)
                }

                const userName = document.createElement("p");
                userName.classList.add("user-name");
                userName.innerText = `${result.userInfo.firstName} ${result.userInfo.lastName}`;
                userDiv.appendChild(userName);

                const userScore = document.createElement("p");
                userScore.classList.add("user-score");
                userScore.innerText = `${result.score}`;
                userDiv.appendChild(userScore);

                leaderBoard.appendChild(userDiv);
            })
        } else {
            document.getElementById("leader-board").style.display = 'none';
        }
    }





    /* TO ADD QUESTION */

    const questionTypeSelect = document.getElementById('question-type');
    const optionsContainer = document.getElementById('options-container');
    const optionTextInput = document.getElementById('option-text');
    const addOptionButton = document.getElementById('add-option');
    const optionsList = document.getElementById('options-list');
    const correctAnswerInput = document.getElementById('correct-answer');

    let optionsArray = [];

    questionTypeSelect.addEventListener('change', () => {
        if (questionTypeSelect.value === 'radio' || questionTypeSelect.value === 'checkbox') {
            optionsContainer.style.display = "block";
        } else {
            optionsContainer.style.display = "none";
            optionsArray = [];
            optionsList.innerHTML = '';
            correctAnswerInput.value = '';
        }
    });

    addOptionButton.addEventListener('click', () => {
        const optionValue = optionTextInput.value.trim();
        if (optionValue) {
            optionsArray.push(optionValue);

            const optionItem = document.createElement('p');
            optionItem.textContent = optionValue;
            optionsList.appendChild(optionItem);

            optionTextInput.value = '';
        }
    });

    questionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const questionType = questionTypeSelect.value;
        const questionText = document.getElementById("question-text").value.trim();
        let inputCorrectAnswer = document.getElementById("correct-answer").value;

        if (typeof inputCorrectAnswer !== 'string') {
            alert('Error: correct answer input is not a valid string.');
            return;
        }

        inputCorrectAnswer = inputCorrectAnswer.trim().toLowerCase();

        if (!questionText || (questionType !== "text" && optionsArray.length === 0)) {
            alert("Please complete all fields before submitting");
            return;
        }
        if (questionType === 'radio') {
            if (!optionsArray.includes(inputCorrectAnswer)) {
                alert("The correct answer must be one of the added options.");
                return;
            }
        } else if (questionType === 'checkbox') {
            const correctAnswers = inputCorrectAnswer.split(',').map(ans => ans.trim());
            if (correctAnswers.length < 2) {
                alert("Please specify two correct answers for the checkbox question.");
                return;
            }
            if (!correctAnswers.every(ans => optionsArray.includes(ans))) {
                alert("All correct answers must be among the added options.");
                return;
            }
            inputCorrectAnswer = correctAnswers;
        }

        const newQuestion = {
            question: questionText,
            options: questionType === "text" ? [] : optionsArray,
            correct: questionType === "checkbox" ? inputCorrectAnswer : inputCorrectAnswer
        };

        // Save to localStorage
        let storedQuestions = JSON.parse(localStorage.getItem("userQuestions")) || [];
        storedQuestions.push(newQuestion);
        localStorage.setItem("userQuestions", JSON.stringify(storedQuestions));

        // Clear the form after saving to localStorage
        questionForm.reset();
        optionsArray = [];
        optionsList.innerHTML = "";

        fetchQuestions();
    });
});
