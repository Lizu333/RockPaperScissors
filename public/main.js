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


function getTranslation(
    key,
    fallback = ""
) {
    const language =
        appState.currentLanguage || "hu";

    return (
        translations &&
        translations[language] &&
        translations[language][key]
    ) || fallback;
}


function openLocalConfirmModal(
    message,
    action
) {
    const messageElement =
        document.getElementById(
            "confirm-message"
        );

    if (messageElement) {
        messageElement.textContent =
            message;
    }

    pendingConfirmAction =
        action;

    openModal(
        "confirm-modal"
    );
}


function setButtonLoading(
    button,
    loading
) {
    if (!button) {
        return;
    }

    button.disabled =
        Boolean(loading);

    button.classList.toggle(
        "loading",
        Boolean(loading)
    );
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
                    playSound(
                        "click"
                    );
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


const authProfileBtn =
    document.getElementById(
        "auth-profile-btn"
    );

if (authProfileBtn) {
    authProfileBtn.addEventListener(
        "click",
        () => {
            updateProfileUI();

            openModal(
                "profile-modal"
            );
        }
    );
}


const authSettingsBtn =
    document.getElementById(
        "auth-settings-btn"
    );

if (authSettingsBtn) {
    authSettingsBtn.addEventListener(
        "click",
        () =>
            openModal(
                "settings-modal"
            )
    );
}


const authReportModalBtn =
    document.getElementById(
        "auth-report-modal-btn"
    );

if (authReportModalBtn) {
    authReportModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "report-modal"
            )
    );
}


const authPrivacyModalBtn =
    document.getElementById(
        "auth-privacy-modal-btn"
    );

if (authPrivacyModalBtn) {
    authPrivacyModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "privacy-modal"
            )
    );
}


const tictactoeGameBtn =
    document.getElementById(
        "tictactoe-game-btn"
    );

if (tictactoeGameBtn) {
    tictactoeGameBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            showScreen(
                "tictactoe-screen"
            );

            initTicTacToe();
        }
    );
}


const rpsGameBtn =
    document.getElementById(
        "rps-game-btn"
    );

if (rpsGameBtn) {
    rpsGameBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            showScreen(
                "game-screen"
            );

            initRpsGame();
        }
    );
}


const game2048Btn =
    document.getElementById(
        "2048-game-btn"
    );

if (game2048Btn) {
    game2048Btn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            showScreen(
                "game-2048-screen"
            );

            init2048Game();
        }
    );
}


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
            () => {
                setTheme(
                    btn.dataset.theme
                );
            }
        );
    });


document
    .querySelectorAll(
        ".setting-lang-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                setLanguage(
                    btn.dataset.settingLang
                );
            }
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
            appState.soundEnabled =
                !appState.soundEnabled;

            if (
                appState.soundEnabled
            ) {
                playSound(
                    "click"
                );
            }

            const soundToggleText =
                document.getElementById(
                    "sound-toggle-text"
                );

            if (
                soundToggleText
            ) {
                soundToggleText.textContent =
                    appState.soundEnabled
                        ? getTranslation(
                              "on",
                              "ON"
                          )
                        : getTranslation(
                              "off",
                              "OFF"
                          );
            }
        }
    );
}


function switchAuthMode(
    mode
) {
    const loginForm =
        document.getElementById(
            "auth-login-form"
        );

    const registerForm =
        document.getElementById(
            "auth-register-form"
        );

    const loginTab =
        document.getElementById(
            "auth-login-tab"
        );

    const registerTab =
        document.getElementById(
            "auth-register-tab"
        );

    if (
        !loginForm ||
        !registerForm
    ) {
        return;
    }

    const isLogin =
        mode === "login";

    loginForm.style.display =
        isLogin
            ? "block"
            : "none";

    registerForm.style.display =
        isLogin
            ? "none"
            : "block";

    if (loginTab) {
        loginTab.classList.toggle(
            "active",
            isLogin
        );
    }

    if (registerTab) {
        registerTab.classList.toggle(
            "active",
            !isLogin
        );
    }

    const loginError =
        document.getElementById(
            "profile-auth-error"
        );

    const registerError =
        document.getElementById(
            "auth-register-error"
        );

    if (loginError) {
        loginError.textContent =
            "";
    }

    if (registerError) {
        registerError.textContent =
            "";
    }
}


const authLoginTab =
    document.getElementById(
        "auth-login-tab"
    );

if (authLoginTab) {
    authLoginTab.addEventListener(
        "click",
        () =>
            switchAuthMode(
                "login"
            )
    );
}


const authRegisterTab =
    document.getElementById(
        "auth-register-tab"
    );

if (authRegisterTab) {
    authRegisterTab.addEventListener(
        "click",
        () =>
            switchAuthMode(
                "register"
            )
    );
}


async function performLogin() {
    const usernameElement =
        document.getElementById(
            "auth-login-username"
        );

    const passwordElement =
        document.getElementById(
            "auth-login-password"
        );

    const submitButton =
        document.getElementById(
            "auth-login-submit"
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
        !username.trim() ||
        !password
    ) {
        const error =
            document.getElementById(
                "profile-auth-error"
            );

        if (error) {
            error.textContent =
                getTranslation(
                    "loginRequired",
                    appState.currentLanguage ===
                        "hu"
                        ? "Add meg a felhasználónevet és a jelszót!"
                        : "Enter your username and password!"
                );
        }

        return;
    }

    setButtonLoading(
        submitButton,
        true
    );

    try {
        await loginUser(
            username,
            password
        );
    } finally {
        setButtonLoading(
            submitButton,
            false
        );
    }
}


const authLoginSubmit =
    document.getElementById(
        "auth-login-submit"
    );

if (authLoginSubmit) {
    authLoginSubmit.addEventListener(
        "click",
        performLogin
    );
}


async function performRegister() {
    const usernameElement =
        document.getElementById(
            "auth-register-username"
        );

    const passwordElement =
        document.getElementById(
            "auth-register-password"
        );

    const passwordConfirmElement =
        document.getElementById(
            "auth-register-password-confirm"
        );

    const privacyCheckbox =
        document.getElementById(
            "auth-register-privacy"
        );

    const submitButton =
        document.getElementById(
            "auth-register-submit"
        );

    const errorElement =
        document.getElementById(
            "auth-register-error"
        );

    const username =
        usernameElement
            ? usernameElement.value
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    const passwordConfirm =
        passwordConfirmElement
            ? passwordConfirmElement.value
            : "";

    const privacyAccepted =
        Boolean(
            privacyCheckbox &&
            privacyCheckbox.checked
        );

    if (
        !username.trim() ||
        !password ||
        !passwordConfirm
    ) {
        if (errorElement) {
            errorElement.textContent =
                appState.currentLanguage ===
                    "hu"
                    ? "Minden kötelező mezőt tölts ki!"
                    : "Please fill in all required fields!";
        }

        return;
    }

    if (
        password !==
        passwordConfirm
    ) {
        if (errorElement) {
            errorElement.textContent =
                appState.currentLanguage ===
                    "hu"
                    ? "A két jelszó nem egyezik."
                    : "The passwords do not match.";
        }

        return;
    }

    if (
        password.length < 8
    ) {
        if (errorElement) {
            errorElement.textContent =
                appState.currentLanguage ===
                    "hu"
                    ? "A jelszónak legalább 8 karakteresnek kell lennie."
                    : "The password must be at least 8 characters long.";
        }

        return;
    }

    if (
        !privacyAccepted
    ) {
        if (errorElement) {
            errorElement.textContent =
                getTranslation(
                    "privacyRequiredError",
                    appState.currentLanguage ===
                        "hu"
                        ? "Az adatvédelmi tájékoztató elfogadása kötelező."
                        : "You must accept the privacy policy."
                );
        }

        return;
    }

    setButtonLoading(
        submitButton,
        true
    );

    try {
        await registerUser(
            username,
            password,
            passwordConfirm,
            privacyAccepted
        );
    } finally {
        setButtonLoading(
            submitButton,
            false
        );
    }
}


const authRegisterSubmit =
    document.getElementById(
        "auth-register-submit"
    );

if (authRegisterSubmit) {
    authRegisterSubmit.addEventListener(
        "click",
        performRegister
    );
}


const authRegisterPrivacyLink =
    document.getElementById(
        "auth-register-privacy-link"
    );

if (authRegisterPrivacyLink) {
    authRegisterPrivacyLink.addEventListener(
        "click",
        () =>
            openModal(
                "privacy-modal"
            )
    );
}


const logoutBtn =
    document.getElementById(
        "logout-btn"
    );

if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        () => {
            openLocalConfirmModal(
                getTranslation(
                    "confirmLogout",
                    appState.currentLanguage ===
                        "hu"
                        ? "Biztosan ki szeretnél jelentkezni?"
                        : "Are you sure you want to log out?"
                ),

                async () => {
                    await logoutUser();

                    resetGame();
                }
            );
        }
    );
}


const resetStatisticsBtn =
    document.getElementById(
        "reset-statistics-btn"
    );

if (resetStatisticsBtn) {
    resetStatisticsBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                return;
            }

            const isRps =
                appState.activeProfileGame ===
                "rps";

            const endpoint =
                isRps
                    ? "/api/statistics"
                    : "/api/statistics/2048";

            const confirmMessage =
                getTranslation(
                    isRps
                        ? "confirmResetStats"
                        : "confirmResetStats2048",
                    appState.currentLanguage ===
                        "hu"
                        ? "Biztosan törölni szeretnéd ezeket a statisztikákat?"
                        : "Are you sure you want to reset these statistics?"
                );

            openLocalConfirmModal(
                confirmMessage,
                async () => {
                    try {
                        const response =
                            await fetch(
                                endpoint,
                                {
                                    method:
                                        "DELETE",
                                    credentials:
                                        "same-origin",
                                    cache:
                                        "no-store",
                                    headers: {
                                        "X-CSRF-Token":
                                            appState.csrfToken,
                                        "Accept":
                                            "application/json"
                                    }
                                }
                            );

                        const data =
                            await response
                                .json()
                                .catch(
                                    () => ({})
                                );

                        if (
                            !response.ok
                        ) {
                            console.error(
                                data.error ||
                                "A statisztikák törlése sikertelen."
                            );

                            return;
                        }

                        if (
                            isRps
                        ) {
                            appState.statistics.gamesPlayed =
                                0;

                            appState.statistics.wins =
                                0;

                            appState.statistics.losses =
                                0;

                            appState.statistics.draws =
                                0;

                            appState.statistics.rock =
                                0;

                            appState.statistics.paper =
                                0;

                            appState.statistics.scissors =
                                0;
                        } else {
                            appState.statistics.matches2048 =
                                0;

                            appState.statistics.maxScore2048 =
                                0;

                            appState.statistics.undosUsed2048 =
                                0;
                        }

                        updateStatisticsUI();
                    } catch (error) {
                        console.error(
                            "Statistics reset error:",
                            error
                        );
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

            pendingConfirmAction =
                null;

            closeModal(
                "confirm-modal"
            );

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
            pendingConfirmAction =
                null;

            closeModal(
                "confirm-modal"
            );
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


const creatorModalBtn =
    document.getElementById(
        "creator-modal-btn"
    );

if (creatorModalBtn) {
    creatorModalBtn.addEventListener(
        "click",
        () =>
            openModal(
                "creator-modal"
            )
    );
}


document
    .querySelectorAll(
        ".target-score-btn"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                if (
                    btn.dataset.difficulty
                ) {
                    setDifficulty(
                        btn.dataset.difficulty
                    );
                }
            }
        );
    });


document
    .querySelectorAll(
        ".profile-game-tab"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                appState.activeProfileGame =
                    btn.dataset.profileGame;
            }
        );
    });


const menuGameBtn =
    document.getElementById(
        "menu-game-btn"
    );

if (menuGameBtn) {
    menuGameBtn.addEventListener(
        "click",
        () => {
            showScreen(
                "menu-screen"
            );
        }
    );
}


const resetGameBtn =
    document.getElementById(
        "reset-btn"
    );

if (resetGameBtn) {
    resetGameBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            resetGame();
        }
    );
}


const game2048MenuBtn =
    document.getElementById(
        "2048-menu-btn"
    );

if (game2048MenuBtn) {
    game2048MenuBtn.addEventListener(
        "click",
        () => {
            showScreen(
                "menu-screen"
            );
        }
    );
}


const game2048NewGameBtn =
    document.getElementById(
        "2048-new-game-btn"
    );

if (game2048NewGameBtn) {
    game2048NewGameBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            init2048Game();
        }
    );
}


const game2048OverlayNewGame =
    document.getElementById(
        "2048-overlay-new-game"
    );

if (game2048OverlayNewGame) {
    game2048OverlayNewGame.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            init2048Game();
        }
    );
}


const game2048OverlayMenu =
    document.getElementById(
        "2048-overlay-menu"
    );

if (game2048OverlayMenu) {
    game2048OverlayMenu.addEventListener(
        "click",
        () => {
            showScreen(
                "menu-screen"
            );
        }
    );
}


const tictactoeMenuBtn =
    document.getElementById(
        "tictactoe-menu-btn"
    );

if (tictactoeMenuBtn) {
    tictactoeMenuBtn.addEventListener(
        "click",
        () => {
            showScreen(
                "menu-screen"
            );
        }
    );
}


const tictactoeNewGameBtn =
    document.getElementById(
        "tictactoe-new-game-btn"
    );

if (tictactoeNewGameBtn) {
    tictactoeNewGameBtn.addEventListener(
        "click",
        () => {
            if (
                !appState.currentUser
            ) {
                showScreen(
                    "auth-screen"
                );

                return;
            }

            initTicTacToe();
        }
    );
}


initRpsGame();
init2048Game();
initTicTacToe();


const savedTheme =
    localStorage.getItem(
        "gameTheme"
    ) ||
    "pink-brown";

const savedLanguage =
    localStorage.getItem(
        "gameLanguage"
    ) ||
    "hu";


setTheme(
    savedTheme,
    false
);


setLanguage(
    savedLanguage
);


setDifficulty(
    appState.currentDifficulty || 5,
    false
);


document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Enter"
        ) {
            const loginForm =
                document.getElementById(
                    "auth-login-form"
                );

            const registerForm =
                document.getElementById(
                    "auth-register-form"
                );

            if (
                loginForm &&
                loginForm.style.display !==
                    "none"
            ) {
                const active =
                    document.activeElement;

                if (
                    active &&
                    (
                        active.id ===
                            "auth-login-username" ||
                        active.id ===
                            "auth-login-password"
                    )
                ) {
                    event.preventDefault();

                    performLogin();
                }
            }

            if (
                registerForm &&
                registerForm.style.display !==
                    "none"
            ) {
                const active =
                    document.activeElement;

                if (
                    active &&
                    (
                        active.id ===
                            "auth-register-username" ||
                        active.id ===
                            "auth-register-password" ||
                        active.id ===
                            "auth-register-password-confirm"
                    )
                ) {
                    event.preventDefault();

                    performRegister();
                }
            }
        }
    }
);


checkLogin();