document.addEventListener("DOMContentLoaded", () => { 

const fNameInput = document.getElementById("f-name");
const lNameInput = document.getElementById("l-name");
const emailInput = document.getElementById("email");
const quizFieldset = document.getElementById("quiz-fieldset");
const quizForm = document.getElementById("quiz-form");
let questionData = [];

 leaderBoard();

fNameInput.addEventListener("input", formValidation);
lNameInput.addEventListener("input", formValidation);
emailInput.addEventListener("input", formValidation);

fetchQuestions();

function fetchQuestions() {
    fetch('./questions.json')
    .then((res) => res.json())
    .then((data) => {
        questionData = data.questions;
        displayQuestions(data.questions);
    })
    .catch((error) => console.log("Could not fetch data:", error));
};

// function to display errorMessages where needed
function showErrorMessage(container, message) {
    let errorMessage = container.querySelector(".error-message");

    if(!errorMessage) {
        errorMessage = document.createElement("p");
        errorMessage.classList.add("error-message");
        container.appendChild(errorMessage);
    }

    errorMessage.innerText = message;
    errorMessage.style.display =  "block";
}

function hideError(container) {
    const errorMessage = container.querySelector(".error-message");
    if(errorMessage) {
     errorMessage.style.display = "none";
        }
}

function maxSelection(questionIndex, maxSel, answersDiv) {
    const checkboxes = document.querySelectorAll(`input[name="question${questionIndex}"]`);
    checkboxes.forEach((checkbox) => {
        const selectedBoxes = Array.from(checkboxes).filter(box => box.checked);
        
        if(selectedBoxes.length > maxSel) {
            checkbox.checked = false;
            showErrorMessage(answersDiv, `Max amount to select is ${maxSel}`);
        } else {
           hideError(answersDiv);
        }
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
        // the option is shown as a string from TextNode
            input.type = Array.isArray(questionObject.correct) ? "checkbox" : "radio";
            input.name = `question${index}`;
            input.value = option;

            label.appendChild(input);
            label.appendChild(document.createTextNode(option));
            answersDiv.appendChild(label);
        }); 

        // call maxSelection function and set 2 to maxSel
        if (Array.isArray(questionObject.correct)) {
            maxSelection(index, 2, answersDiv);
        }
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
    
    let isValid = true;

    if(!fNameInput.value.trim()) {
        showErrorMessage(fNameInput.parentElement, "First name is required.");
        isValid = false;
    } else{
        hideError(fNameInput.parentElement);
    }
    if(!lNameInput.value.trim()) {
        showErrorMessage(lNameInput.parentElement, "Last name is required.");
        isValid = false;
    } else{
        hideError(lNameInput.parentElement);
    }
    if(!emailInput.value.trim()) {
        showErrorMessage(emailInput.parentElement, "Email is required.");
        isValid = false;
    } else{
        hideError(emailInput.parentElement);
    }
    
    quizFieldset.disabled = !isValid;
    return isValid;
}

quizForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // check that the information form is valid
    if (!formValidation()) {
        console.log("Form is not valid, submit is blocked.");
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

    //resetting the quiz and form for another user
    quizForm.reset();
    document.querySelector(".information-form").reset();
    quizFieldset.disabled = true;
});

// Show result of the quiz
function showResult(result) {
    const resultContainer = document.querySelector(".result-container");
    let score = 0;

    questionData.forEach((question, index) => {
        const usersAnswer = result.answers[`question${index + 1}`];
        const correctAnswer = question.correct;
    
    
    if (Array.isArray(correctAnswer)) {
        let multiChoiceScore = 0;

        if (usersAnswer){
            usersAnswer.forEach((answer) => {
                if (correctAnswer.includes(answer)) {
                    multiChoiceScore++;
                }
            });
        }
        //max points is set to 2 (equals to the max amount choices user can make)
        score += Math.min(multiChoiceScore, 2)

    } else {
        if (usersAnswer && usersAnswer[0] === correctAnswer) {
            score++;
            }
        }
    });
    //add the score to the result-object
    result.score = score;

    // update QuizResult with the score (to be able to show a leaderBoard / compare results)
    let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    quizResults[quizResults.length - 1] = result;
    localStorage.setItem("quizResults", JSON.stringify(quizResults));

    resultContainer.innerHTML =`
    <h2>Your result:</h2>
    <h3>${result.userInfo.firstName} ${result.userInfo.lastName}</h3>
    <p>You got ${score} correct out of ${questionData.length} questions!</p>
    <p>Date: ${new Date(result.timestamp).toLocaleDateString()}</p>
    `;

}

function leaderBoard() {
        let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];

    
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

        quizResults.forEach((result) => {
            const userDiv = document.createElement("div");
            userDiv.classList.add("leaderboard-div");

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

    
}

});
