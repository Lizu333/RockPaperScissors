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

function setLoggedOutState() {
    appState.currentUser = null;
    appState.csrfToken = null;
    appState.statistics = emptyStatistics();

    updateProfileUI();
    updateStatisticsUI();
}

function getAuthErrorElements() {
    return [
        document.getElementById("auth-error"),
        document.getElementById("profile-auth-error"),
        document.getElementById("auth-register-error")
    ].filter(Boolean);
}

function setAuthError(message = "") {
    getAuthErrorElements().forEach(element => {
        element.textContent = message;
    });
}

async function parseJsonResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (
        contentType
            .toLowerCase()
            .includes("application/json")
    ) {
        return await response.json();
    }

    return {};
}

async function loadCsrfToken() {
    try {
        const response = await fetch(
            "/api/csrf",
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data =
            await parseJsonResponse(response);

        if (
            !response.ok ||
            typeof data.csrfToken !== "string" ||
            data.csrfToken.length === 0
        ) {
            throw new Error(
                data.error ||
                "CSRF token betöltése sikertelen."
            );
        }

        appState.csrfToken =
            data.csrfToken;

        return true;
    } catch (error) {
        console.error(
            "CSRF error:",
            error
        );

        appState.csrfToken = null;

        return false;
    }
}

async function apiFetch(url, options = {}) {
    const method =
        String(
            options.method || "GET"
        ).toUpperCase();

    const headers =
        new Headers(
            options.headers || {}
        );

    const protectedMethods = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    ];

    if (
        protectedMethods.includes(method)
    ) {
        if (
            !appState.csrfToken &&
            !(await loadCsrfToken())
        ) {
            throw new Error(
                "CSRF token unavailable"
            );
        }

        headers.set(
            "X-CSRF-Token",
            appState.csrfToken
        );
    }

    return fetch(
        url,
        {
            ...options,
            method,
            credentials: "same-origin",
            cache: "no-store",
            headers
        }
    );
}

async function checkLogin() {
    try {
        const response =
            await fetch(
                "/api/me",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        if (
            response.status === 403
        ) {
            showScreen(
                "auth-screen"
            );

            return false;
        }

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!data.loggedIn) {
            setLoggedOutState();

            if (
                !appState.csrfToken
            ) {
                await loadCsrfToken();
            }

            showScreen(
                "auth-screen"
            );

            return false;
        }

        appState.currentUser =
            data.user;

        appState.csrfToken =
            data.csrfToken || null;

        if (
            data.user &&
            data.user.theme
        ) {
            setTheme(
                data.user.theme,
                false
            );
        }

        if (
            data.user &&
            data.user.difficulty
        ) {
            setDifficulty(
                data.user.difficulty,
                false
            );
        } else {
            setDifficulty(
                5,
                false
            );
        }

        applyStatistics(
            data.statistics
        );

        updateProfileUI();

        showScreen(
            "menu-screen"
        );

        return true;
    } catch (error) {
        console.error(
            "checkLogin error:",
            error
        );

        setLoggedOutState();

        showScreen(
            "auth-screen"
        );

        return false;
    }
}

async function registerUser(
    username,
    password,
    passwordConfirm,
    privacyAccepted
) {
    setAuthError("");

    const genderElement =
        document.querySelector(
            'input[name="auth-gender"]:checked'
        );

    const gender =
        genderElement
            ? genderElement.value
            : "";

    try {
        if (
            !appState.csrfToken &&
            !(await loadCsrfToken())
        ) {
            throw new Error(
                "CSRF token unavailable"
            );
        }

        const response =
            await apiFetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password,
                        passwordConfirm,
                        gender,
                        privacyAccepted
                    })
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {
            setAuthError(
                data.error ||
                (
                    appState.currentLanguage ===
                        "hu"
                        ? "A regisztráció sikertelen."
                        : "Registration failed."
                )
            );

            return false;
        }

        if (
            !data.user ||
            typeof data.user.username !==
                "string"
        ) {
            throw new Error(
                "Invalid registration response"
            );
        }

        appState.currentUser =
            data.user;

        appState.csrfToken =
            data.csrfToken || null;

        if (
            data.user.theme
        ) {
            setTheme(
                data.user.theme,
                false
            );
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

        const loaded =
            await loadUserStatistics();

        if (!loaded) {
            throw new Error(
                "A regisztráció után a munkamenet nem volt elérhető."
            );
        }

        updateProfileUI();

        showScreen(
            "menu-screen"
        );

        return true;
    } catch (error) {
        console.error(
            "registerUser error:",
            error
        );

        setAuthError(
            appState.currentLanguage ===
                "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server."
        );

        return false;
    }
}

async function loginUser(
    username,
    password
) {
    setAuthError("");

    try {
        if (
            !appState.csrfToken &&
            !(await loadCsrfToken())
        ) {
            throw new Error(
                "CSRF token unavailable"
            );
        }

        const response =
            await apiFetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {
            setAuthError(
                data.error ||
                (
                    appState.currentLanguage ===
                        "hu"
                        ? "Hibás felhasználónév vagy jelszó!"
                        : "Invalid username or password!"
                )
            );

            return false;
        }

        if (
            !data.user ||
            typeof data.user.username !==
                "string"
        ) {
            throw new Error(
                "Invalid login response"
            );
        }

        appState.currentUser =
            data.user;

        appState.csrfToken =
            data.csrfToken || null;

        if (
            data.user.theme
        ) {
            setTheme(
                data.user.theme,
                false
            );
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

        const loaded =
            await loadUserStatistics();

        if (!loaded) {
            throw new Error(
                "A bejelentkezés után a session nem volt elérhető."
            );
        }

        updateProfileUI();

        showScreen(
            "menu-screen"
        );

        return true;
    } catch (error) {
        console.error(
            "loginUser error:",
            error
        );

        setAuthError(
            appState.currentLanguage ===
                "hu"
                ? "Nem sikerült kapcsolódni a szerverhez."
                : "Could not connect to the server."
        );

        return false;
    }
}

async function logoutUser() {
    try {
        if (!appState.csrfToken) {
            await loadCsrfToken();
        }

        const response =
            await apiFetch(
                "/api/logout",
                {
                    method: "POST",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (
            !response.ok
        ) {
            console.error(
                "Logout error:",
                data
            );
        } else if (
            data.csrfToken
        ) {
            appState.csrfToken =
                data.csrfToken;
        }
    } catch (error) {
        console.error(
            "logoutUser error:",
            error
        );
    }

    setLoggedOutState();

    showScreen(
        "auth-screen"
    );
}

async function loadUserStatistics() {
    if (!appState.currentUser) {
        return false;
    }

    try {
        const response =
            await fetch(
                "/api/me",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            setLoggedOutState();

            return false;
        }

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (
            !data.loggedIn ||
            !data.user
        ) {
            setLoggedOutState();

            return false;
        }

        appState.currentUser =
            data.user;

        if (
            data.csrfToken
        ) {
            appState.csrfToken =
                data.csrfToken;
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

        applyStatistics(
            data.statistics
        );

        updateProfileUI();

        return true;
    } catch (error) {
        console.error(
            "loadUserStatistics error:",
            error
        );

        return false;
    }
}

function updateProfileUI() {
    const authForms =
        document.getElementById(
            "profile-auth-forms"
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

    if (
        !authForms ||
        !loggedInView ||
        !currentUsernameElem ||
        !joinDateElem
    ) {
        return;
    }

    if (
        appState.currentUser
    ) {
        authForms.style.display =
            "none";

        loggedInView.style.display =
            "block";

        currentUsernameElem.textContent =
            appState.currentUser.username;

        joinDateElem.textContent =
            appState.currentUser.joined ||
            "-";

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

    if (
        !allowedThemes.includes(
            themeKey
        )
    ) {
        return;
    }

    appState.currentTheme =
        themeKey;

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
        !appState.currentUser
    ) {
        return;
    }

    try {
        const response =
            await apiFetch(
                "/api/theme",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        theme: themeKey
                    })
                }
            );

        if (
            response.ok
        ) {
            appState.currentUser.theme =
                themeKey;
        }
    } catch (error) {
        console.error(
            "setTheme error:",
            error
        );
    }
}

function updateDifficultyUI() {
    document
        .querySelectorAll(
            ".target-score-btn"
        )
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                Number(
                    btn.dataset.difficulty
                ) ===
                    appState.currentDifficulty
            );
        });
}

async function setDifficulty(
    value,
    saveToServer = true
) {
    const parsedValue =
        Number(value);

    if (
        ![
            3,
            5,
            10
        ].includes(parsedValue)
    ) {
        return;
    }

    appState.currentDifficulty =
        parsedValue;

    updateDifficultyUI();

    if (
        !saveToServer ||
        !appState.currentUser
    ) {
        return;
    }

    try {
        const response =
            await apiFetch(
                "/api/difficulty",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        difficulty:
                            parsedValue
                    })
                }
            );

        if (
            response.ok
        ) {
            appState.currentUser.difficulty =
                parsedValue;
        }
    } catch (error) {
        console.error(
            "setDifficulty error:",
            error
        );
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
                  ) *
                      100
              )
            : 0;

    if (winRateElement) {
        winRateElement.textContent =
            `${winRate}%`;
    }

    const matches2048Elem =
        document.getElementById(
            "matches-2048"
        );

    const bestScore2048Elem =
        document.getElementById(
            "best-score-2048"
        );

    const undosUsed2048Elem =
        document.getElementById(
            "undos-used-2048"
        );

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

function setActiveProfileGame(
    game
) {
    appState.activeProfileGame =
        game;

    document
        .querySelectorAll(
            ".profile-game-tab"
        )
        .forEach(btn => {
            const isActive =
                btn.dataset.profileGame ===
                game;

            btn.classList.toggle(
                "active",
                isActive
            );

            btn.setAttribute(
                "aria-selected",
                isActive
                    ? "true"
                    : "false"
            );
        });

    const rpsBlock =
        document.getElementById(
            "rps-stats-block"
        );

    const game2048Block =
        document.getElementById(
            "game2048-stats-block"
        );

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
    .querySelectorAll(
        ".profile-game-tab"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                setActiveProfileGame(
                    btn.dataset.profileGame
                );
            }
        );
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
    setDifficulty,
    apiFetch,
    loadCsrfToken
};
