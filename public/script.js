alert("A SCRIPT.JS BETÖLTŐDÖTT!");

let playerScore = 0;
let computerScore = 0;
let targetScore = 5;

let currentLanguage = "hu";
let currentTheme = "pink-brown";
let soundEnabled = true;

let statistics = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rock: 0,
    paper: 0,
    scissors: 0
};

let audioCtx = null;
let currentUser = null;

let gameFinished = false;
let gameStarting = false;
let roundInProgress = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function initAudio() {
    if (!audioCtx) {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        audioCtx = new AudioContext();
    }

    if (audioCtx.state === "suspended") {
        await audioCtx.resume();
    }
}

window.addEventListener(
    "click",
    initAudio,
    { once: true }
);

window.addEventListener(
    "keydown",
    initAudio,
    { once: true }
);

function playSound(type) {
    if (!soundEnabled) {
        return;
    }

    initAudio();

    if (!audioCtx) {
        return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === "click") {
        osc.type = "sine";

        osc.frequency.setValueAtTime(
            500,
            now
        );

        gain.gain.setValueAtTime(
            0.08,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.05
        );

        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === "win") {
        osc.type = "triangle";

        osc.frequency.setValueAtTime(
            440,
            now
        );

        osc.frequency.setValueAtTime(
            554.37,
            now + 0.08
        );

        gain.gain.setValueAtTime(
            0.12,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.25
        );

        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === "lose") {
        osc.type = "sawtooth";

        osc.frequency.setValueAtTime(
            280,
            now
        );

        osc.frequency.linearRampToValueAtTime(
            140,
            now + 0.2
        );

        gain.gain.setValueAtTime(
            0.1,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.2
        );

        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === "draw") {
        osc.type = "sine";

        osc.frequency.setValueAtTime(
            320,
            now
        );

        gain.gain.setValueAtTime(
            0.08,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.12
        );

        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === "gameover-win") {
        osc.type = "triangle";

        osc.frequency.setValueAtTime(
            523.25,
            now
        );

        osc.frequency.setValueAtTime(
            659.25,
            now + 0.1
        );

        osc.frequency.setValueAtTime(
            783.99,
            now + 0.2
        );

        gain.gain.setValueAtTime(
            0.15,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.45
        );

        osc.start(now);
        osc.stop(now + 0.45);
    } else if (type === "computer") {
        osc.type = "sine";

        osc.frequency.setValueAtTime(
            380,
            now
        );

        osc.frequency.linearRampToValueAtTime(
            620,
            now + 0.08
        );

        gain.gain.setValueAtTime(
            0.06,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.12
        );

        osc.start(now);
        osc.stop(now + 0.12);
    }
}

const choiceIcons = {
    rock: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/><path d="M11.99 22 14 12l7.822 3.184"/><path d="M14 12 8.47 2.302"/></svg>`,

    paper: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a2 2 0 0 0-2 2v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>`,

    scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`
};

const choiceNames = {
    hu: {
        rock: "KŐ",
        paper: "PAPÍR",
        scissors: "OLLÓ"
    },

    en: {
        rock: "ROCK",
        paper: "PAPER",
        scissors: "SCISSORS"
    }
};

const translations = {
    en: {
        title: "Rock - Paper - Scissors",
        description:
            "Reach the target score first and be the winner!",
        targetScore: "Target Score:",
        startGame: "START GAME",
        profile: "PROFILE",
        settings: "SETTINGS",
        mainMenu: "MAIN MENU",
        reset: "NEW GAME",
        you: "PLAYER",
        opponent: "OPPONENT",
        waiting: "Waiting...",
        chooseWeapon: "Choose your weapon",
        playAgain: "PLAY AGAIN",
        gamesPlayed: "GAMES PLAYED",
        wins: "WINS",
        losses: "LOSSES",
        draws: "DRAWS",
        winRate: "WIN RATE",
        favoriteChoice: "MOST USED",
        resetStatistics: "RESET STATISTICS",
        language: "LANGUAGE",
        theme: "THEME",
        sound: "SOUND",
        on: "ON",
        off: "OFF",
        close: "CLOSE",
        playerProfile: "PLAYER PROFILE",
        login: "LOGIN",
        register: "REGISTER",
        loggedInAs: "Logged in as:",
        joinedDate: "Joined:",
        genderLabel: "Gender:",
        girl: "Girl",
        boy: "Boy",
        logout: "LOGOUT",
        roundStarted: "Round started...",
        computerChoosing:
            "Computer is choosing...",
        reveal: "REVEAL!",
        roundWin: "You won this round!",
        roundLoss: "You lost this round!",
        roundDraw:
            "It's a draw this round!",
        endWinTitle: "YOU WIN!",
        endWinMessage:
            "Congratulations, you reached the target score first!",
        endLossTitle: "YOU LOST!",
        endLossMessage:
            "The opponent reached the target score first."
    },

    hu: {
        title: "Kő - Papír - Olló",
        description:
            "Érd el elsőként a célpontszámot és nyerj!",
        targetScore: "Célpontszám:",
        startGame: "JÁTÉK INDÍTÁSA",
        profile: "PROFIL",
        settings: "BEÁLLÍTÁSOK",
        mainMenu: "FŐMENÜ",
        reset: "ÚJ JÁTÉK",
        you: "JÁTÉKOS",
        opponent: "ELLENFÉL",
        waiting: "Várakozás...",
        chooseWeapon: "Válassz fegyvert",
        playAgain: "ÚJ JÁTÉK",
        gamesPlayed: "LEJÁTSZOTT",
        wins: "GYŐZELEM",
        losses: "VERESÉG",
        draws: "DÖNTETLEN",
        winRate: "GYŐZELMI ARÁNY",
        favoriteChoice: "LEGTÖBBET HASZNÁLT",
        resetStatistics:
            "STATISZTIKÁK TÖRLÉSE",
        language: "NYELV",
        theme: "TÉMA",
        sound: "HANG",
        on: "BE",
        off: "KI",
        close: "BEZÁRÁS",
        playerProfile: "JÁTÉKOS PROFIL",
        login: "BEJELENTKEZÉS",
        register: "REGISZTRÁCIÓ",
        loggedInAs: "Bejelentkezve:",
        joinedDate: "Csatlakozott:",
        genderLabel: "Nem:",
        girl: "Lány",
        boy: "Fiú",
        logout: "KIJELENTKEZÉS",
        roundStarted: "Kör elindult...",
        computerChoosing:
            "A gép választ...",
        reveal: "FELFEDÉS!",
        roundWin:
            "Megnyerted ezt a kört!",
        roundLoss:
            "Elvesztetted ezt a kört!",
        roundDraw:
            "Döntetlen ebben a körben!",
        endWinTitle: "NYERTÉL!",
        endWinMessage:
            "Gratulálunk, te érted el előbb a célpontszámot!",
        endLossTitle: "VESZTETTÉL!",
        endLossMessage:
            "Az ellenfél érte el előbb a célpontszámot."
    }
};

function showScreen(screenId) {
    document
        .querySelectorAll(".screen")
        .forEach(screen =>
            screen.classList.remove("active")
        );

    const screen =
        document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }
}

function openModal(modalId) {
    const modal =
        document.getElementById(modalId);

    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(modalId) {
    const modal =
        document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("active");
    }
}

function emptyStatistics() {
    return {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rock: 0,
        paper: 0,
        scissors: 0
    };
}

function applyStatistics(data) {
    if (!data) {
        return;
    }

    statistics = {
        gamesPlayed:
            Number(data.games_played) || 0,
        wins:
            Number(data.wins) || 0,
        losses:
            Number(data.losses) || 0,
        draws:
            Number(data.draws) || 0,
        rock:
            Number(data.rock) || 0,
        paper:
            Number(data.paper) || 0,
        scissors:
            Number(data.scissors) || 0
    };

    updateStatisticsUI();
}

async function parseResponse(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function checkLogin() {
    try {
        const response =
            await fetch("/api/me");

        const data =
            await parseResponse(response);

        if (!data.loggedIn) {
            currentUser = null;
            statistics = emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            setTheme(
                data.user.theme,
                false
            );
        }

        applyStatistics(
            data.statistics
        );

        updateProfileUI();
    } catch (error) {
        console.error(error);
    }
}

async function startGame() {
    if (
        gameStarting ||
        roundInProgress
    ) {
        return;
    }

    if (!currentUser) {
        openModal("profile-modal");
        return;
    }

    gameStarting = true;

    try {
        const response =
            await fetch("/api/game/start", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    targetScore
                })
            });

        const data =
            await parseResponse(response);

        if (!response.ok) {
            if (response.status === 401) {
                currentUser = null;
                updateProfileUI();
                openModal("profile-modal");
            }

            return;
        }

        playerScore =
            Number(data.playerScore) || 0;

        computerScore =
            Number(data.computerScore) || 0;

        if (
            Number.isInteger(
                Number(data.targetScore)
            )
        ) {
            targetScore =
                Number(data.targetScore);
        }

        gameFinished = false;
        roundInProgress = false;

        document.getElementById(
            "player-score"
        ).textContent = playerScore;

        document.getElementById(
            "computer-score"
        ).textContent = computerScore;

        document.getElementById(
            "player-choice"
        ).textContent = "?";

        document.getElementById(
            "computer-choice"
        ).textContent = "?";

        document.getElementById(
            "player-choice-name"
        ).textContent =
            translations[
                currentLanguage
            ].waiting;

        document.getElementById(
            "computer-choice-name"
        ).textContent =
            translations[
                currentLanguage
            ].waiting;

        document.getElementById(
            "result"
        ).textContent =
            translations[
                currentLanguage
            ].chooseWeapon;

        setChoiceButtonsDisabled(false);

        showScreen("game-screen");
    } catch (error) {
        console.error(error);
    } finally {
        gameStarting = false;
    }
}

function setChoiceButtonsDisabled(
    disabled
) {
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

function setChoiceArea(
    choiceId,
    choice
) {
    const element =
        document.getElementById(
            choiceId
        );

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

async function playRound(
    playerChoice
) {
    if (
        !currentUser ||
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

    resultElement.textContent =
        translations[
            currentLanguage
        ].roundStarted;

    playerChoiceName.textContent =
        choiceNames[
            currentLanguage
        ][playerChoice] ||
        playerChoice.toUpperCase();

    setChoiceArea(
        "player-choice",
        playerChoice
    );

    computerChoiceElement.textContent =
        "?";

    computerChoiceName.textContent =
        translations[
            currentLanguage
        ].computerChoosing;

    playSound("click");

    try {
        const responsePromise =
            fetch("/api/game/round", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    playerChoice
                })
            });

        const choicesKeys = [
            "rock",
            "paper",
            "scissors"
        ];

        for (let i = 0; i < 6; i++) {
            const randomChoice =
                choicesKeys[i % 3];

            setChoiceArea(
                "computer-choice",
                randomChoice
            );

            playSound("computer");

            await sleep(120);
        }

        const response =
            await responsePromise;

        const data =
            await parseResponse(response);

        if (!response.ok) {
            console.error(
                data.error ||
                    "A kör indítása sikertelen."
            );

            if (
                response.status === 401
            ) {
                currentUser = null;
                updateProfileUI();
                showScreen("menu-screen");
            }

            return;
        }

        setChoiceArea(
            "player-choice",
            data.playerChoice
        );

        playerChoiceName.textContent =
            choiceNames[
                currentLanguage
            ][data.playerChoice];

        playerChoiceElement.classList.add(
            "choice-reveal"
        );

        setChoiceArea(
            "computer-choice",
            data.computerChoice
        );

        computerChoiceName.textContent =
            choiceNames[
                currentLanguage
            ][data.computerChoice];

        computerChoiceElement.classList.add(
            "choice-reveal"
        );

        await sleep(200);

        playerScore =
            Number(data.playerScore) || 0;

        computerScore =
            Number(data.computerScore) || 0;

        document.getElementById(
            "player-score"
        ).textContent = playerScore;

        document.getElementById(
            "computer-score"
        ).textContent = computerScore;

        let resultText;

        if (data.result === "draw") {
            resultText =
                translations[
                    currentLanguage
                ].roundDraw;

            playSound("draw");
        } else if (
            data.result === "win"
        ) {
            resultText =
                translations[
                    currentLanguage
                ].roundWin;

            playSound("win");
        } else {
            resultText =
                translations[
                    currentLanguage
                ].roundLoss;

            playSound("lose");
        }

        resultElement.textContent =
            resultText;

        applyStatistics(
            data.statistics
        );

        if (data.gameFinished) {
            gameFinished = true;

            await sleep(1000);

            await finishGame(
                data.finalResult
            );

            return;
        }

        await sleep(800);

        resultElement.textContent =
            translations[
                currentLanguage
            ].chooseWeapon;

        setChoiceButtonsDisabled(
            false
        );
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
            playerScore >
            computerScore
                ? "win"
                : "loss"
        );

    try {
        const response =
            await fetch(
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
            await parseResponse(response);

        if (response.ok) {
            applyStatistics(
                data.statistics
            );
        }
    } catch (error) {
        console.error(error);
    }

    const winMsg =
        currentLanguage === "hu"
            ? `Gratulálunk, te érted el előbb a ${targetScore} pontot!`
            : `Congratulations, you reached ${targetScore} points first!`;

    const lossMsg =
        currentLanguage === "hu"
            ? `Az ellenfél érte el előbb a ${targetScore} pontot.`
            : `The opponent reached ${targetScore} points first.`;

    if (finalResult === "win") {
        document.getElementById(
            "end-title"
        ).textContent =
            translations[
                currentLanguage
            ].endWinTitle;

        document.getElementById(
            "end-message"
        ).textContent = winMsg;

        playSound(
            "gameover-win"
        );
    } else {
        document.getElementById(
            "end-title"
        ).textContent =
            translations[
                currentLanguage
            ].endLossTitle;

        document.getElementById(
            "end-message"
        ).textContent = lossMsg;

        playSound("lose");
    }

    document.getElementById(
        "final-player-score"
    ).textContent = playerScore;

    document.getElementById(
        "final-computer-score"
    ).textContent =
        computerScore;

    setChoiceButtonsDisabled(true);

    showScreen("end-screen");
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gameFinished = false;
    roundInProgress = false;

    document.getElementById(
        "player-score"
    ).textContent = "0";

    document.getElementById(
        "computer-score"
    ).textContent = "0";

    document.getElementById(
        "player-choice"
    ).textContent = "?";

    document.getElementById(
        "computer-choice"
    ).textContent = "?";

    document.getElementById(
        "player-choice-name"
    ).textContent =
        translations[
            currentLanguage
        ].waiting;

    document.getElementById(
        "computer-choice-name"
    ).textContent =
        translations[
            currentLanguage
        ].waiting;

    document.getElementById(
        "result"
    ).textContent =
        translations[
            currentLanguage
        ].chooseWeapon;

    setChoiceButtonsDisabled(false);
}

async function registerUser(
    username,
    password
) {
    const errorElement =
        document.getElementById(
            "auth-error"
        );

    errorElement.textContent = "";

    const genderElement =
        document.querySelector(
            'input[name="gender"]:checked'
        );

    const gender =
        genderElement
            ? genderElement.value
            : "girl";

    try {
        const response =
            await fetch(
                "/api/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        gender
                    })
                }
            );

        const data =
            await parseResponse(response);

        if (!response.ok) {
            errorElement.textContent =
                data.error ||
                "Hiba történt.";

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            await setTheme(
                data.user.theme,
                false
            );
        }

        await loadUserStatistics();

        updateProfileUI();
    } catch (error) {
        console.error(error);

        errorElement.textContent =
            currentLanguage === "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server.";
    }
}

async function loginUser(
    username,
    password
) {
    const errorElement =
        document.getElementById(
            "auth-error"
        );

    errorElement.textContent = "";

    try {
        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

        const data =
            await parseResponse(response);

        if (!response.ok) {
            errorElement.textContent =
                data.error ||
                (
                    currentLanguage === "hu"
                        ? "Hibás felhasználónév vagy jelszó!"
                        : "Invalid username or password!"
                );

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            await setTheme(
                data.user.theme,
                false
            );
        }

        await loadUserStatistics();

        updateProfileUI();
    } catch (error) {
        console.error(error);

        errorElement.textContent =
            currentLanguage === "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server.";
    }
}

async function logoutUser() {
    try {
        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );
    } catch (error) {
        console.error(error);
    }

    currentUser = null;
    statistics = emptyStatistics();

    resetGame();

    updateProfileUI();
    updateStatisticsUI();

    showScreen("menu-screen");
}

async function loadUserStatistics() {
    if (!currentUser) {
        return;
    }

    try {
        const response =
            await fetch("/api/me");

        const data =
            await parseResponse(response);

        if (!data.loggedIn) {
            currentUser = null;
            statistics =
                emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();

            return;
        }

        currentUser = data.user;

        applyStatistics(
            data.statistics
        );

        updateProfileUI();
    } catch (error) {
        console.error(error);
    }
}

function updateProfileUI() {
    const authForms =
        document.getElementById(
            "auth-forms"
        );

    const loggedInView =
        document.getElementById(
            "logged-in-view"
        );

    const currentUsernameElem =
        document.getElementById(
            "current-username"
        );

    const joinDateElem =
        document.getElementById(
            "user-join-date"
        );

    if (currentUser) {
        authForms.style.display =
            "none";

        loggedInView.style.display =
            "block";

        currentUsernameElem.textContent =
            currentUser.username;

        joinDateElem.textContent =
            currentUser.joined || "-";

        updateStatisticsUI();
    } else {
        authForms.style.display =
            "block";

        loggedInView.style.display =
            "none";
    }
}

async function setTheme(
    themeKey,
    saveToServer = true
) {
    const allowedThemes = [
        "cream-teal",
        "wine-pink",
        "olive-cream",
        "pink-brown",
        "blue-brown",
        "yellow-plum"
    ];

    if (!allowedThemes.includes(themeKey)) {
        return;
    }

    currentTheme = themeKey;

    document.body.setAttribute(
        "data-theme",
        themeKey
    );

    localStorage.setItem(
        "gameTheme",
        themeKey
    );

    if (
        !saveToServer ||
        !currentUser
    ) {
        return;
    }

    try {
        const response =
            await fetch(
                "/api/theme",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        theme: themeKey
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        currentUser.theme =
            themeKey;
    } catch (error) {
        console.error(error);
    }
}

function setLanguage(lang) {
    if (!translations[lang]) {
        return;
    }

    currentLanguage = lang;

    localStorage.setItem(
        "gameLanguage",
        lang
    );

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(elem => {
            const key =
                elem.dataset.i18n;

            if (
                translations[lang] &&
                translations[lang][key]
            ) {
                elem.textContent =
                    translations[lang][key];
            }
        });

    document
        .querySelectorAll(
            ".setting-lang-btn"
        )
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.settingLang ===
                    lang
            );
        });

    const soundToggleText =
        document.getElementById(
            "sound-toggle-text"
        );

    if (soundToggleText) {
        soundToggleText.textContent =
            soundEnabled
                ? translations[
                      currentLanguage
                  ].on
                : translations[
                      currentLanguage
                  ].off;
    }

    if (
        !roundInProgress &&
        !gameFinished
    ) {
        document.getElementById(
            "player-choice-name"
        ).textContent =
            translations[
                currentLanguage
            ].waiting;

        document.getElementById(
            "computer-choice-name"
        ).textContent =
            translations[
                currentLanguage
            ].waiting;

        document.getElementById(
            "result"
        ).textContent =
            translations[
                currentLanguage
            ].chooseWeapon;
    }
}

function updateStatisticsUI() {
    const gamesPlayed =
        document.getElementById(
            "games-played"
        );

    const totalWins =
        document.getElementById(
            "total-wins"
        );

    const totalLosses =
        document.getElementById(
            "total-losses"
        );

    const totalDraws =
        document.getElementById(
            "total-draws"
        );

    const rockUsed =
        document.getElementById(
            "rock-used"
        );

    const paperUsed =
        document.getElementById(
            "paper-used"
        );

    const scissorsUsed =
        document.getElementById(
            "scissors-used"
        );

    const winRateElement =
        document.getElementById(
            "win-rate"
        );

    if (gamesPlayed) {
        gamesPlayed.textContent =
            statistics.gamesPlayed;
    }

    if (totalWins) {
        totalWins.textContent =
            statistics.wins;
    }

    if (totalLosses) {
        totalLosses.textContent =
            statistics.losses;
    }

    if (totalDraws) {
        totalDraws.textContent =
            statistics.draws;
    }

    if (rockUsed) {
        rockUsed.textContent =
            statistics.rock;
    }

    if (paperUsed) {
        paperUsed.textContent =
            statistics.paper;
    }

    if (scissorsUsed) {
        scissorsUsed.textContent =
            statistics.scissors;
    }

    const winRate =
        statistics.gamesPlayed > 0
            ? Math.round(
                  (
                      statistics.wins /
                      statistics.gamesPlayed
                  ) * 100
              )
            : 0;

    if (winRateElement) {
        winRateElement.textContent =
            `${winRate}%`;
    }
}

document
    .querySelectorAll("button")
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                if (
                    btn.id !==
                    "sound-toggle"
                ) {
                    playSound("click");
                }
            }
        );
    });

document
    .querySelectorAll(
        ".target-score-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                document
                    .querySelectorAll(
                        ".target-score-btn"
                    )
                    .forEach(b =>
                        b.classList.remove(
                            "active"
                        )
                    );

                btn.classList.add(
                    "active"
                );

                const score =
                    parseInt(
                        btn.dataset.score,
                        10
                    );

                if (
                    [3, 5, 7].includes(
                        score
                    )
                ) {
                    targetScore = score;
                }
            }
        );
    });

const langModalBtn =
    document.getElementById(
        "lang-modal-btn"
    );

if (langModalBtn) {
    langModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "settings-modal"
            )
    );
}

const themeModalBtn =
    document.getElementById(
        "theme-modal-btn"
    );

if (themeModalBtn) {
    themeModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "settings-modal"
            )
    );
}

const startBtn =
    document.getElementById(
        "start-btn"
    );

if (startBtn) {
    startBtn.addEventListener(
        "click",
        startGame
    );
}

const profileBtn =
    document.getElementById(
        "profile-btn"
    );

if (profileBtn) {
    profileBtn.addEventListener(
        "click",
        () => {
            updateProfileUI();
            openModal(
                "profile-modal"
            );
        }
    );
}

const settingsBtn =
    document.getElementById(
        "settings-btn"
    );

if (settingsBtn) {
    settingsBtn.addEventListener(
        "click",
        () =>
            openModal(
                "settings-modal"
            )
    );
}

const menuGameBtn =
    document.getElementById(
        "menu-game-btn"
    );

if (menuGameBtn) {
    menuGameBtn.addEventListener(
        "click",
        () =>
            showScreen(
                "menu-screen"
            )
    );
}

const menuBtn =
    document.getElementById(
        "menu-btn"
    );

if (menuBtn) {
    menuBtn.addEventListener(
        "click",
        () =>
            showScreen(
                "menu-screen"
            )
    );
}

const resetBtn =
    document.getElementById(
        "reset-btn"
    );

if (resetBtn) {
    resetBtn.addEventListener(
        "click",
        startGame
    );
}

const playAgainBtn =
    document.getElementById(
        "play-again-btn"
    );

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

document
    .querySelectorAll(
        ".modal-close, .close-settings-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                const modalId =
                    btn.dataset.close;

                if (modalId) {
                    closeModal(
                        modalId
                    );
                }
            }
        );
    });

document
    .querySelectorAll(
        ".theme-preset-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () =>
                setTheme(
                    btn.dataset.theme
                )
        );
    });

document
    .querySelectorAll(
        ".setting-lang-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () =>
                setLanguage(
                    btn.dataset.settingLang
                )
        );
    });

const soundToggle =
    document.getElementById(
        "sound-toggle"
    );

if (soundToggle) {
    soundToggle.addEventListener(
        "click",
        () => {
            soundEnabled =
                !soundEnabled;

            if (soundEnabled) {
                playSound("click");
            }

            document.getElementById(
                "sound-toggle-text"
            ).textContent =
                soundEnabled
                    ? translations[
                          currentLanguage
                      ].on
                    : translations[
                          currentLanguage
                      ].off;
        }
    );
}

const registerBtn =
    document.getElementById(
        "register-btn"
    );

if (registerBtn) {
    registerBtn.addEventListener(
        "click",
        () => {
            const username =
                document.getElementById(
                    "username-input"
                ).value;

            const password =
                document.getElementById(
                    "password-input"
                ).value;

            registerUser(
                username,
                password
            );
        }
    );
}

const loginBtn =
    document.getElementById(
        "login-btn"
    );

if (loginBtn) {
    loginBtn.addEventListener(
        "click",
        () => {
            const username =
                document.getElementById(
                    "username-input"
                ).value;

            const password =
                document.getElementById(
                    "password-input"
                ).value;

            loginUser(
                username,
                password
            );
        }
    );
}

const logoutBtn =
    document.getElementById(
        "logout-btn"
    );

if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        logoutUser
    );
}

const resetStatisticsBtn =
    document.getElementById(
        "reset-statistics-btn"
    );

if (resetStatisticsBtn) {
    resetStatisticsBtn.addEventListener(
        "click",
        async () => {
            if (!currentUser) {
                return;
            }

            try {
                const response =
                    await fetch(
                        "/api/statistics",
                        {
                            method:
                                "DELETE"
                        }
                    );

                const data =
                    await parseResponse(
                        response
                    );

                if (!response.ok) {
                    return;
                }

                statistics =
                    emptyStatistics();

                updateStatisticsUI();
            } catch (error) {
                console.error(error);
            }
        }
    );
}

const reportModalBtn =
    document.getElementById(
        "report-modal-btn"
    );

if (reportModalBtn) {
    reportModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "report-modal"
            )
    );
}

const privacyModalBtn =
    document.getElementById(
        "privacy-modal-btn"
    );

if (privacyModalBtn) {
    privacyModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "privacy-modal"
            )
    );
}

const savedTheme =
    localStorage.getItem(
        "gameTheme"
    ) || "pink-brown";

const savedLanguage =
    localStorage.getItem(
        "gameLanguage"
    ) || "hu";

setTheme(
    savedTheme,
    false
);

setLanguage(
    savedLanguage
);

checkLogin();