import {
    appState,
    sleep
} from "../../core/state.js";

import {
    showScreen,
    openModal
} from "../../core/ui.js";

import {
    translations
} from "../../core/i18n.js";

import {
    apiFetch,
    applyStatistics,
    updateProfileUI
} from "../../core/api.js";

import {
    playSound
} from "../../core/audio.js";


let playerScore = 0;
let computerScore = 0;
let currentTargetScore = 5;

let gameFinished = false;
let gameStarting = false;
let roundInProgress = false;
let initialized = false;


const choiceIcons = {
    rock: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
            <path d="M11.99 22 14 12l7.822 3.184"/>
            <path d="M14 12 8.47 2.302"/>
        </svg>
    `,

    paper: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <path d="M15 12h-5"/>
            <path d="M15 8h-5"/>
            <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
            <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a2 2 0 0 0-2 2v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>
        </svg>
    `,

    scissors: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <path d="M8.12 8.12 12 12"/>
            <path d="M20 4 8.12 15.88"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M14.8 14.8 20 20"/>
        </svg>
    `
};


function updateTargetScoreInfo() {
    const targetInfo =
        document.getElementById(
            "target-score-info"
        );

    if (targetInfo) {
        targetInfo.textContent =
            `${translations[
                appState.currentLanguage
            ].targetScoreLabel} ${currentTargetScore}`;
    }
}


function setChoiceButtonsDisabled(disabled) {
    document
        .querySelectorAll(".choice-btn")
        .forEach(btn => {
            btn.disabled = disabled;
            btn.classList.toggle(
                "disabled",
                disabled
            );
        });
}


function setChoiceArea(choiceId, choice) {
    const element =
        document.getElementById(choiceId);

    if (!element) {
        return;
    }

    if (
        choice &&
        choiceIcons[choice]
    ) {
        element.innerHTML =
            choiceIcons[choice];
    } else {
        element.textContent = "?";
    }
}


async function startGame() {
    if (
        gameStarting ||
        roundInProgress
    ) {
        return;
    }

    if (!appState.currentUser) {
        openModal("profile-modal");
        return;
    }

    gameStarting = true;

    try {
        const response =
            await apiFetch(
                "/api/game/start",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        difficulty:
                            appState.currentDifficulty
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                appState.currentUser = null;

                updateProfileUI();

                openModal(
                    "profile-modal"
                );
            }

            return;
        }

        playerScore =
            Number(data.playerScore) || 0;

        computerScore =
            Number(data.computerScore) || 0;

        currentTargetScore =
            Number(data.targetScore) || 5;

        gameFinished = false;
        roundInProgress = false;

        const playerScoreElement =
            document.getElementById(
                "player-score"
            );

        const computerScoreElement =
            document.getElementById(
                "computer-score"
            );

        const playerChoiceElement =
            document.getElementById(
                "player-choice"
            );

        const computerChoiceElement =
            document.getElementById(
                "computer-choice"
            );

        if (playerScoreElement) {
            playerScoreElement.textContent =
                playerScore;
        }

        if (computerScoreElement) {
            computerScoreElement.textContent =
                computerScore;
        }

        if (playerChoiceElement) {
            playerChoiceElement.textContent =
                "?";
        }

        if (computerChoiceElement) {
            computerChoiceElement.textContent =
                "?";
        }

        const playerChoiceName =
            document.getElementById(
                "player-choice-name"
            );

        const computerChoiceName =
            document.getElementById(
                "computer-choice-name"
            );

        const resultElement =
            document.getElementById(
                "result"
            );

        if (playerChoiceName) {
            playerChoiceName.textContent =
                translations[
                    appState.currentLanguage
                ].waiting;
        }

        if (computerChoiceName) {
            computerChoiceName.textContent =
                translations[
                    appState.currentLanguage
                ].waiting;
        }

        if (resultElement) {
            resultElement.textContent =
                translations[
                    appState.currentLanguage
                ].chooseWeapon;
        }

        updateTargetScoreInfo();

        setChoiceButtonsDisabled(false);

        showScreen("game-screen");
    } catch (error) {
        console.error(error);
    } finally {
        gameStarting = false;
    }
}


async function playRound(playerChoice) {
    if (
        !appState.currentUser ||
        gameFinished ||
        roundInProgress
    ) {
        return;
    }

    roundInProgress = true;

    setChoiceButtonsDisabled(true);

    const playerChoiceElement =
        document.getElementById(
            "player-choice"
        );

    const computerChoiceElement =
        document.getElementById(
            "computer-choice"
        );

    const playerChoiceName =
        document.getElementById(
            "player-choice-name"
        );

    const computerChoiceName =
        document.getElementById(
            "computer-choice-name"
        );

    const resultElement =
        document.getElementById(
            "result"
        );

    playerChoiceElement.classList.remove(
        "choice-reveal"
    );

    computerChoiceElement.classList.remove(
        "choice-reveal"
    );

    playerChoiceElement.textContent = "?";
    computerChoiceElement.textContent = "?";

    playerChoiceName.textContent =
        translations[
            appState.currentLanguage
        ].waiting;

    computerChoiceName.textContent =
        translations[
            appState.currentLanguage
        ].computerChoosing;

    resultElement.textContent =
        translations[
            appState.currentLanguage
        ].computerChoosing;

    playSound("click");

    try {
        const responsePromise =
            apiFetch(
                "/api/game/round",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        playerChoice
                    })
                }
            );

        for (
            const value of ["3", "2", "1"]
        ) {
            resultElement.textContent =
                value;

            playSound("computer");

            await sleep(350);
        }

        resultElement.textContent =
            translations[
                appState.currentLanguage
            ].reveal;

        await sleep(300);

        const response =
            await responsePromise;

        const data =
            await response.json();

        if (!response.ok) {
            console.error(
                data.error ||
                "A kör indítása sikertelen."
            );

            if (response.status === 401) {
                appState.currentUser = null;

                updateProfileUI();
            }

            return;
        }

        setChoiceArea(
            "player-choice",
            data.playerChoice
        );

        playerChoiceName.textContent =
            data.playerChoice.toUpperCase();

        playerChoiceElement.classList.add(
            "choice-reveal"
        );

        await sleep(250);

        setChoiceArea(
            "computer-choice",
            data.computerChoice
        );

        computerChoiceName.textContent =
            data.computerChoice.toUpperCase();

        computerChoiceElement.classList.add(
            "choice-reveal"
        );

        await sleep(350);

        playerScore =
            Number(data.playerScore) || 0;

        computerScore =
            Number(data.computerScore) || 0;

        if (data.targetScore) {
            currentTargetScore =
                Number(data.targetScore) ||
                currentTargetScore;

            updateTargetScoreInfo();
        }

        document.getElementById(
            "player-score"
        ).textContent = playerScore;

        document.getElementById(
            "computer-score"
        ).textContent = computerScore;

        if (data.result === "draw") {
            resultElement.textContent =
                translations[
                    appState.currentLanguage
                ].roundDraw;

            playSound("draw");
        } else if (
            data.result === "win"
        ) {
            resultElement.textContent =
                translations[
                    appState.currentLanguage
                ].roundWin;

            playSound("win");
        } else {
            resultElement.textContent =
                translations[
                    appState.currentLanguage
                ].roundLoss;

            playSound("lose");
        }

        applyStatistics(
            data.statistics
        );

        if (data.gameFinished) {
            gameFinished = true;

            await sleep(900);

            await finishGame(
                data.finalResult
            );

            return;
        }

        await sleep(650);

        resultElement.textContent =
            translations[
                appState.currentLanguage
            ].chooseWeapon;

        setChoiceButtonsDisabled(false);
    } catch (error) {
        console.error(error);

        setChoiceButtonsDisabled(false);
    } finally {
        roundInProgress = false;
    }
}


async function finishGame(
    finalResultFromRound = null
) {
    if (!gameFinished) {
        gameFinished = true;
    }

    const finalResult =
        finalResultFromRound ||
        (
            playerScore > computerScore
                ? "win"
                : "loss"
        );

    try {
        const response =
            await apiFetch(
                "/api/game/finish",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (response.ok) {
            applyStatistics(
                data.statistics
            );
        } else {
            console.error(
                data.error ||
                "A játék lezárása sikertelen."
            );
        }
    } catch (error) {
        console.error(error);
    }

    if (finalResult === "win") {
        document.getElementById(
            "end-title"
        ).textContent =
            appState.currentLanguage === "hu"
                ? "NYERTÉL!"
                : "YOU WIN!";

        document.getElementById(
            "end-message"
        ).textContent =
            appState.currentLanguage === "hu"
                ? "Gratulálunk, te érted el előbb a célpontszámot!"
                : "Congratulations!";

        playSound("gameover-win");
    } else {
        document.getElementById(
            "end-title"
        ).textContent =
            appState.currentLanguage === "hu"
                ? "VESZTETTÉL!"
                : "YOU LOST!";

        document.getElementById(
            "end-message"
        ).textContent =
            appState.currentLanguage === "hu"
                ? "Az ellenfél érte el előbb a célpontszámot."
                : "Better luck next time!";

        playSound("lose");
    }

    document.getElementById(
        "final-player-score"
    ).textContent = playerScore;

    document.getElementById(
        "final-computer-score"
    ).textContent = computerScore;

    setChoiceButtonsDisabled(true);

    showScreen("end-screen");
}


function resetGame() {
    playerScore = 0;
    computerScore = 0;

    gameFinished = false;
    gameStarting = false;
    roundInProgress = false;

    const playerScoreElement =
        document.getElementById(
            "player-score"
        );

    const computerScoreElement =
        document.getElementById(
            "computer-score"
        );

    const playerChoiceElement =
        document.getElementById(
            "player-choice"
        );

    const computerChoiceElement =
        document.getElementById(
            "computer-choice"
        );

    const playerChoiceName =
        document.getElementById(
            "player-choice-name"
        );

    const computerChoiceName =
        document.getElementById(
            "computer-choice-name"
        );

    const resultElement =
        document.getElementById(
            "result"
        );

    if (playerScoreElement) {
        playerScoreElement.textContent = "0";
    }

    if (computerScoreElement) {
        computerScoreElement.textContent = "0";
    }

    if (playerChoiceElement) {
        playerChoiceElement.textContent = "?";
    }

    if (computerChoiceElement) {
        computerChoiceElement.textContent = "?";
    }

    if (playerChoiceName) {
        playerChoiceName.textContent =
            translations[
                appState.currentLanguage
            ].waiting;
    }

    if (computerChoiceName) {
        computerChoiceName.textContent =
            translations[
                appState.currentLanguage
            ].waiting;
    }

    if (resultElement) {
        resultElement.textContent =
            translations[
                appState.currentLanguage
            ].chooseWeapon;
    }

    setChoiceButtonsDisabled(false);
}


function initRpsGame() {
    if (initialized) {
        return;
    }

    initialized = true;
    const rpsGameBtn =
        document.getElementById("rps-game-btn");

    if (rpsGameBtn) {
        rpsGameBtn.addEventListener(
            "click",
            startGame
        );
    }


    //kozben: fomenu
    const menuGameBtn =
        document.getElementById("menu-game-btn");

    if (menuGameBtn) {
        menuGameBtn.addEventListener(
            "click",
            () => {
                resetGame();
                showScreen("menu-screen");
            }
        );
    }


    //vegen: fomenu
    const menuBtn =
        document.getElementById("menu-btn");

    if (menuBtn) {
        menuBtn.addEventListener(
            "click",
            () => {
                resetGame();
                showScreen("menu-screen");
            }
        );
    }


    //kozben: uj jatek
    const resetBtn =
        document.getElementById("reset-btn");

    if (resetBtn) {
        resetBtn.addEventListener(
            "click",
            startGame
        );
    }


    //vege: uj jatek
    const playAgainBtn =
        document.getElementById("play-again-btn");

    if (playAgainBtn) {
        playAgainBtn.addEventListener(
            "click",
            startGame
        );
    }

    document
        .querySelectorAll(".choice-btn")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    if (
                        btn.disabled ||
                        roundInProgress ||
                        gameFinished
                    ) {
                        return;
                    }

                    playRound(
                        btn.dataset.choice
                    );
                }
            );

        });
}


export {
    initRpsGame,
    startGame,
    resetGame
};
