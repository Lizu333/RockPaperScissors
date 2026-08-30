import { appState } from "./core/state.js";
import {
    showScreen,
    openModal,
    closeModal
} from "./core/ui.js";

import {
    translations,
    setLanguage
} from "./core/i18n.js";

import {
    checkLogin,
    registerUser,
    loginUser,
    logoutUser,
    setTheme,
    setDifficulty,
    updateProfileUI,
    updateStatisticsUI
} from "./core/api.js";

import { playSound } from "./core/audio.js";

import {
    initRpsGame,
    resetGame
} from "./games/arcade/rps.js";

import {
    init2048Game
} from "./games/puzzle/game2048.js";

import {
    initTicTacToe
} from "./games/arcade/tictactoe.js";


let pendingConfirmAction = null;


function openLocalConfirmModal(message, action) {
    const messageElement =
        document.getElementById("confirm-message");

    if (messageElement) {
        messageElement.textContent = message;
    }

    pendingConfirmAction = action;

    openModal("confirm-modal");
}


document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.id !== "sound-toggle") {
            playSound("click");
        }
    });
});


const langModalBtn =
    document.getElementById("lang-modal-btn");

if (langModalBtn) {
    langModalBtn.addEventListener(
        "click",
        () => openModal("settings-modal")
    );
}


const themeModalBtn =
    document.getElementById("theme-modal-btn");

if (themeModalBtn) {
    themeModalBtn.addEventListener(
        "click",
        () => openModal("settings-modal")
    );
}


const profileBtn =
    document.getElementById("profile-btn");

if (profileBtn) {
    profileBtn.addEventListener("click", () => {
        updateProfileUI();
        openModal("profile-modal");
    });
}


const settingsBtn =
    document.getElementById("settings-btn");

if (settingsBtn) {
    settingsBtn.addEventListener(
        "click",
        () => openModal("settings-modal")
    );
}

const tictactoeGameBtn =
    document.getElementById("tictactoe-game-btn");

if (tictactoeGameBtn) {
    tictactoeGameBtn.addEventListener("click", () => {
        showScreen("tictactoe-screen");
        initTicTacToe();
    });
}


document
    .querySelectorAll(
        ".modal-close, .close-settings-btn"
    )
    .forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.dataset.close;

            if (modalId) {
                closeModal(modalId);
            }
        });
    });


document
    .querySelectorAll(".theme-preset-btn")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            setTheme(btn.dataset.theme);
        });
    });


document
    .querySelectorAll(".setting-lang-btn")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            setLanguage(
                btn.dataset.settingLang
            );
        });
    });


const soundToggle =
    document.getElementById("sound-toggle");

if (soundToggle) {
    soundToggle.addEventListener("click", () => {
        appState.soundEnabled =
            !appState.soundEnabled;

        if (appState.soundEnabled) {
            playSound("click");
        }

        const soundToggleText =
            document.getElementById(
                "sound-toggle-text"
            );

        if (soundToggleText) {
            soundToggleText.textContent =
                appState.soundEnabled
                    ? translations[
                        appState.currentLanguage
                    ].on
                    : translations[
                        appState.currentLanguage
                    ].off;
        }
    });
}


const registerBtn =
    document.getElementById("register-btn");

if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        const usernameElement =
            document.getElementById(
                "username-input"
            );

        const passwordElement =
            document.getElementById(
                "password-input"
            );

        const privacyCheckbox =
            document.getElementById(
                "privacy-checkbox"
            );

        const errorElement =
            document.getElementById(
                "auth-error"
            );

        const username =
            usernameElement
                ? usernameElement.value
                : "";

        const password =
            passwordElement
                ? passwordElement.value
                : "";

        if (
            !privacyCheckbox ||
            !privacyCheckbox.checked
        ) {
            if (errorElement) {
                errorElement.textContent =
                    translations[
                        appState.currentLanguage
                    ].privacyRequiredError;
            }

            return;
        }

        registerUser(
            username,
            password,
            true
        );
    });
}


const loginBtn =
    document.getElementById("login-btn");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        const usernameElement =
            document.getElementById(
                "username-input"
            );

        const passwordElement =
            document.getElementById(
                "password-input"
            );

        loginUser(
            usernameElement
                ? usernameElement.value
                : "",
            passwordElement
                ? passwordElement.value
                : ""
        );
    });
}


const privacyCheckboxLink =
    document.getElementById(
        "privacy-checkbox-link"
    );

if (privacyCheckboxLink) {
    privacyCheckboxLink.addEventListener(
        "click",
        () => openModal("privacy-modal")
    );
}


const logoutBtn =
    document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        openLocalConfirmModal(
            translations[
                appState.currentLanguage
            ].confirmLogout,

            async () => {
                await logoutUser();
                resetGame();
            }
        );
    });
}


const resetStatisticsBtn =
    document.getElementById(
        "reset-statistics-btn"
    );

if (resetStatisticsBtn) {
    resetStatisticsBtn.addEventListener(
        "click",
        () => {
            if (!appState.currentUser) {
                return;
            }

            const isRps =
                appState.activeProfileGame === "rps";

            const endpoint =
                isRps
                    ? "/api/statistics"
                    : "/api/statistics/2048";

            const confirmMessage =
                translations[
                    appState.currentLanguage
                ][
                    isRps
                        ? "confirmResetStats"
                        : "confirmResetStats2048"
                ];

            openLocalConfirmModal(
                confirmMessage,
                async () => {
                    try {
                        const response =
                            await fetch(
                                endpoint,
                                {
                                    method: "DELETE"
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            console.error(
                                data.error ||
                                "A statisztikák törlése sikertelen."
                            );

                            return;
                        }

                        if (isRps) {
                            appState.statistics.gamesPlayed = 0;
                            appState.statistics.wins = 0;
                            appState.statistics.losses = 0;
                            appState.statistics.draws = 0;
                            appState.statistics.rock = 0;
                            appState.statistics.paper = 0;
                            appState.statistics.scissors = 0;
                        } else {
                            appState.statistics.matches2048 = 0;
                            appState.statistics.maxScore2048 = 0;
                            appState.statistics.undosUsed2048 = 0;
                        }

                        updateStatisticsUI();
                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        }
    );
}


const confirmYesBtn =
    document.getElementById(
        "confirm-yes-btn"
    );

if (confirmYesBtn) {
    confirmYesBtn.addEventListener(
        "click",
        async () => {
            const action =
                pendingConfirmAction;

            pendingConfirmAction = null;

            closeModal("confirm-modal");

            if (action) {
                await action();
            }
        }
    );
}


const confirmNoBtn =
    document.getElementById(
        "confirm-no-btn"
    );

if (confirmNoBtn) {
    confirmNoBtn.addEventListener(
        "click",
        () => {
            pendingConfirmAction = null;
            closeModal("confirm-modal");
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
        () => openModal("report-modal")
    );
}


const privacyModalBtn =
    document.getElementById(
        "privacy-modal-btn"
    );

if (privacyModalBtn) {
    privacyModalBtn.addEventListener(
        "click",
        () => openModal("privacy-modal")
    );
}


const creatorModalBtn =
    document.getElementById(
        "creator-modal-btn"
    );

if (creatorModalBtn) {
    creatorModalBtn.addEventListener(
        "click",
        () => openModal("creator-modal")
    );
}


document
    .querySelectorAll(".target-score-btn")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            setDifficulty(
                btn.dataset.difficulty
            );
        });
    });


document
    .querySelectorAll(".profile-game-tab")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            appState.activeProfileGame =
                btn.dataset.profileGame;
        });
    });

initRpsGame();
init2048Game();
initTicTacToe();


const savedTheme =
    localStorage.getItem("gameTheme") ||
    "pink-brown";

const savedLanguage =
    localStorage.getItem("gameLanguage") ||
    "hu";


setTheme(
    savedTheme,
    false
);

setLanguage(
    savedLanguage
);

setDifficulty(
    appState.currentDifficulty,
    false
);

checkLogin();