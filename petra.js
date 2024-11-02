document.addEventListener("DOMContentLoaded", () => { 

const fNameInput = document.getElementById("f-name");
const lNameInput = document.getElementById("l-name");
const emailInput = document.getElementById("email");
const quizFieldset = document.getElementById("quiz-fieldset");
const quizForm = document.getElementById("quiz-form");
let questionData = [];


function fetchQuestions() {
    fetch('./questions.json')
    .then((res) => res.json())
    .then((data) => {
        questionData = data.questions;
        displayQuestions(data.questions);
    })
    .catch((error) => console.log("Could not fetch data:", error));
};

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
    questionTitle.innerText = `${index +1 }. ${questionObject.question}`;
    questionDiv.appendChild(questionTitle);

    // create the div to hold the answers
    const answersDiv = document.createElement("div");
    answersDiv.classList.add("answers");

    // add answers/options and display depending on type
    if (questionObject.options.length > 0) {
        questionObject.options.forEach(option => {
            const label = document.createElement("label");
            const input = document.createElement("input");
    
        // setting the input type. 
        // if "correct" answers is fetched as an array, set type to checkbox = multiple answers
        // if not, it's considerd a single choice questions = radiobutton
            input.type = Array.isArray(questionObject.correct) ? "checkbox" : "radio";
            input.name = `question${index}`;
            input.value = option;

            label.appendChild(input);
            label.appendChild(document.createTextNode(option));
            answersDiv.appendChild(label);
        }); 
    } else {
        //if correct anwser is fetched as an empty array we set it to be an open ended text entry = text
        const input = document.createElement("input");
        input.type = "text";
        input.name= `question${index}`;
        input.placeholder = "Write your answer";
        answersDiv.appendChild(input);
    }
    // add question and answers div's to question-container
    questionDiv.appendChild(answersDiv);
    questionContainer.appendChild(questionDiv);
    });  
}

function formValidation() {
    if (fNameInput.checkValidity() && lNameInput.checkValidity() && emailInput.checkValidity() ) {
        quizFieldset.disabled = false;
    } else {
        quizFieldset.disabled = true;
    }
}

quizForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const userInfo = {
       firstName: fNameInput.value,
       lastName: lNameInput.value,
       email: emailInput.value,
    };

    const quizAnswers = {};
    const questions = document.querySelectorAll(".question-container .question");

    questions.forEach((question, index) => {
        const selectedOpts = [];
        const inputs = question.querySelectorAll("input");

        inputs.forEach((input) => {
            if (input.type === "radio" || input.type === "checkbox") {
                if (input.checked) selectedOpts.push(input.value);
            } else if (input.type === "text") {
                selectedOpts.push(input.value.trim());
            }
        });

        quizAnswers[`question${index + 1}`] = selectedOpts;
    });


    //save result from quiz
    const result = {
        userInfo: userInfo,
        answers: quizAnswers,
        timestamp: new Date().toISOString(),
    };

  
    let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    quizResults.push(result);
    localStorage.setItem("quizResults", JSON.stringify(quizResults));

    showResult(result);

    quizForm.reset();
    document.querySelector(".information-form").reset();
    quizFieldset.disabled = true;
});

function showResult(result) {
    const resultContainer = document.querySelector(".result-container");
    let score = 0;

    questionData.forEach((question, index) => {
        const usersAnswer = result.answers[`question${index + 1}`];
        const correctAnswer = question.correct;
    
    
    if (Array.isArray(correctAnswer)) {
        if (usersAnswer && JSON.stringify(correctAnswer.sort()) === JSON.stringify(usersAnswer)) {
            score++;
        }
    } else {
        if (usersAnswer && usersAnswer[0] === correctAnswer) {
            score++;
        }
    }
});


    resultContainer.innerHTML =`
    <h3>${result.userInfo.firstName} ${result.userInfo.lastName}</h3>
    <p>You got ${score} correct out of ${questionData.length} questions!</p>
    <p>Date: ${new Date(result.timestamp).toLocaleDateString()}</p>
    `;
}

fNameInput.addEventListener("input", formValidation);
lNameInput.addEventListener("input", formValidation);
emailInput.addEventListener("input", formValidation);

fetchQuestions();

});
