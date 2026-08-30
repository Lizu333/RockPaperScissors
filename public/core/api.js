import { appState } from "./state.js";
import { showScreen } from "./ui.js";


function emptyStatistics() {
    return {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rock: 0,
        paper: 0,
        scissors: 0,
        matches2048: 0,
        maxScore2048: 0,
        undosUsed2048: 0
    };
}


function applyStatistics(data) {
    if (!data) {
        return;
    }

    appState.statistics = {
        gamesPlayed: Number(data.games_played) || 0,
        wins: Number(data.wins) || 0,
        losses: Number(data.losses) || 0,
        draws: Number(data.draws) || 0,
        rock: Number(data.rock) || 0,
        paper: Number(data.paper) || 0,
        scissors: Number(data.scissors) || 0,
        matches2048: Number(data.matches_2048) || 0,
        maxScore2048: Number(data.max_score_2048) || 0,
        undosUsed2048: Number(data.undos_used_2048) || 0
    };

    updateStatisticsUI();
}


async function checkLogin() {
    try {
        const response = await fetch("/api/me");
        const data = await response.json();

        if (!data.loggedIn) {
            appState.currentUser = null;
            appState.csrfToken = null;
            appState.statistics = emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();
            return;
        }

        appState.currentUser = data.user;
        appState.csrfToken = data.csrfToken || null;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(data.user.difficulty || 5, false);

        applyStatistics(data.statistics);
        updateProfileUI();
    } catch (error) {
        console.error(error);
    }
}


async function registerUser(username, password, privacyAccepted) {
    const errorElement = document.getElementById("auth-error");

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";

    const genderElement = document.querySelector(
        'input[name="gender"]:checked'
    );

    const gender = genderElement ? genderElement.value : "";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password,
                gender,
                privacyAccepted
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.error || "Hiba történt.";
            return;
        }

        appState.currentUser = data.user;
        appState.csrfToken = data.csrfToken || null;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(data.user.difficulty || 5, false);

        await loadUserStatistics();
        updateProfileUI();
    } catch (error) {
        console.error(error);

        errorElement.textContent =
            appState.currentLanguage === "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server.";
    }
}


async function loginUser(username, password) {
    const errorElement = document.getElementById("auth-error");

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent =
                data.error ||
                (
                    appState.currentLanguage === "hu"
                        ? "Hibás felhasználónév vagy jelszó!"
                        : "Invalid username or password!"
                );

            return;
        }

        appState.currentUser = data.user;
        appState.csrfToken = data.csrfToken || null;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(data.user.difficulty || 5, false);

        await loadUserStatistics();
        updateProfileUI();
    } catch (error) {
        console.error(error);

        errorElement.textContent =
            appState.currentLanguage === "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server.";
    }
}


async function logoutUser() {
    try {
        const response = await fetch("/api/logout", {
            method: "POST"
        });

        if (!response.ok) {
            console.error("A kijelentkezés sikertelen.");
        }
    } catch (error) {
        console.error(error);
    }

    appState.currentUser = null;
    appState.csrfToken = null;
    appState.statistics = emptyStatistics();

    updateProfileUI();
    updateStatisticsUI();
    showScreen("menu-screen");
}


async function loadUserStatistics() {
    if (!appState.currentUser) {
        return;
    }

    try {
        const response = await fetch("/api/me");
        const data = await response.json();

        if (!data.loggedIn) {
            appState.currentUser = null;
            appState.csrfToken = null;
            appState.statistics = emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();
            return;
        }

        appState.currentUser = data.user;
        appState.csrfToken = data.csrfToken || null;

        setDifficulty(data.user.difficulty || 5, false);

        applyStatistics(data.statistics);
        updateProfileUI();
    } catch (error) {
        console.error(error);
    }
}


function updateProfileUI() {
    const authForms = document.getElementById("auth-forms");
    const loggedInView = document.getElementById("logged-in-view");
    const currentUsernameElem = document.getElementById("current-username");
    const joinDateElem = document.getElementById("user-join-date");

    if (
        !authForms ||
        !loggedInView ||
        !currentUsernameElem ||
        !joinDateElem
    ) {
        return;
    }

    if (appState.currentUser) {
        authForms.style.display = "none";
        loggedInView.style.display = "block";

        currentUsernameElem.textContent =
            appState.currentUser.username;

        joinDateElem.textContent =
            appState.currentUser.joined || "-";

        updateStatisticsUI();
    } else {
        authForms.style.display = "block";
        loggedInView.style.display = "none";
    }
}


async function setTheme(themeKey, saveToServer = true) {
    appState.currentTheme = themeKey;

    document.body.setAttribute("data-theme", themeKey);
    localStorage.setItem("gameTheme", themeKey);

    if (!saveToServer || !appState.currentUser) {
        return;
    }

    try {
        const response = await fetch("/api/theme", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                theme: themeKey
            })
        });

        if (response.ok) {
            appState.currentUser.theme = themeKey;
        }
    } catch (error) {
        console.error(error);
    }
}


function updateDifficultyUI() {
    document.querySelectorAll(".target-score-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            Number(btn.dataset.difficulty) ===
                appState.currentDifficulty
        );
    });
}


async function setDifficulty(value, saveToServer = true) {
    const parsedValue = Number(value);

    if (![3, 5, 10].includes(parsedValue)) {
        return;
    }

    appState.currentDifficulty = parsedValue;

    updateDifficultyUI();

    if (!saveToServer || !appState.currentUser) {
        return;
    }

    try {
        const response = await fetch("/api/difficulty", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                difficulty: parsedValue
            })
        });

        if (!response.ok) {
            console.error(
                "A nehézségi szint mentése sikertelen."
            );

            return;
        }

        appState.currentUser.difficulty = parsedValue;
    } catch (error) {
        console.error(error);
    }
}


function updateStatisticsUI() {
    const gamesPlayed =
        document.getElementById("games-played");

    const totalWins =
        document.getElementById("total-wins");

    const totalLosses =
        document.getElementById("total-losses");

    const totalDraws =
        document.getElementById("total-draws");

    const rockUsed =
        document.getElementById("rock-used");

    const paperUsed =
        document.getElementById("paper-used");

    const scissorsUsed =
        document.getElementById("scissors-used");

    const winRateElement =
        document.getElementById("win-rate");

    if (gamesPlayed) {
        gamesPlayed.textContent =
            appState.statistics.gamesPlayed;
    }

    if (totalWins) {
        totalWins.textContent =
            appState.statistics.wins;
    }

    if (totalLosses) {
        totalLosses.textContent =
            appState.statistics.losses;
    }

    if (totalDraws) {
        totalDraws.textContent =
            appState.statistics.draws;
    }

    if (rockUsed) {
        rockUsed.textContent =
            appState.statistics.rock;
    }

    if (paperUsed) {
        paperUsed.textContent =
            appState.statistics.paper;
    }

    if (scissorsUsed) {
        scissorsUsed.textContent =
            appState.statistics.scissors;
    }

    const winRate =
        appState.statistics.gamesPlayed > 0
            ? Math.round(
                (
                    appState.statistics.wins /
                    appState.statistics.gamesPlayed
                ) * 100
            )
            : 0;

    if (winRateElement) {
        winRateElement.textContent =
            `${winRate}%`;
    }

    const matches2048Elem =
        document.getElementById("matches-2048");

    const bestScore2048Elem =
        document.getElementById("best-score-2048");

    const undosUsed2048Elem =
        document.getElementById("undos-used-2048");

    if (matches2048Elem) {
        matches2048Elem.textContent =
            appState.statistics.matches2048;
    }

    if (bestScore2048Elem) {
        bestScore2048Elem.textContent =
            appState.statistics.maxScore2048;
    }

    if (undosUsed2048Elem) {
        undosUsed2048Elem.textContent =
            appState.statistics.undosUsed2048;
    }
}


function setActiveProfileGame(game) {
    appState.activeProfileGame = game;

    document
        .querySelectorAll(".profile-game-tab")
        .forEach(btn => {
            const isActive =
                btn.dataset.profileGame === game;

            btn.classList.toggle(
                "active",
                isActive
            );

            btn.setAttribute(
                "aria-selected",
                isActive ? "true" : "false"
            );
        });

    const rpsBlock =
        document.getElementById("rps-stats-block");

    const game2048Block =
        document.getElementById("game2048-stats-block");

    if (rpsBlock) {
        rpsBlock.classList.toggle(
            "active",
            game === "rps"
        );
    }

    if (game2048Block) {
        game2048Block.classList.toggle(
            "active",
            game === "2048"
        );
    }
}


document
    .querySelectorAll(".profile-game-tab")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            setActiveProfileGame(
                btn.dataset.profileGame
            );
        });
    });


export {
    emptyStatistics,
    applyStatistics,
    checkLogin,
    registerUser,
    loginUser,
    logoutUser,
    loadUserStatistics,
    updateProfileUI,
    setTheme,
    updateStatisticsUI,
    setActiveProfileGame,
    setDifficulty
};