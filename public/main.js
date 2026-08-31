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


const authLoginModeBtn = document.getElementById("auth-login-mode-btn");
const authRegisterModeBtn = document.getElementById("auth-register-mode-btn");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

function setAuthMode(mode) {
    const loginMode = mode === "login";
    if (loginForm) loginForm.style.display = loginMode ? "flex" : "none";
    if (registerForm) registerForm.style.display = loginMode ? "none" : "flex";
    if (authLoginModeBtn) authLoginModeBtn.classList.toggle("active", loginMode);
    if (authRegisterModeBtn) authRegisterModeBtn.classList.toggle("active", !loginMode);
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");
    if (loginError) loginError.textContent = "";
    if (registerError) registerError.textContent = "";
}

if (authLoginModeBtn) authLoginModeBtn.addEventListener("click", () => setAuthMode("login"));
if (authRegisterModeBtn) authRegisterModeBtn.addEventListener("click", () => setAuthMode("register"));

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        const username = document.getElementById("auth-login-username")?.value || "";
        const password = document.getElementById("auth-login-password")?.value || "";
        const error = document.getElementById("login-error");
        if (error) error.textContent = "";
        const oldAuthError = document.getElementById("auth-error");
        if (oldAuthError) oldAuthError.textContent = "";
        const ok = await loginUser(username, password);
        if (!ok && error) {
            const source = document.getElementById("auth-error");
            error.textContent = source?.textContent || (appState.currentLanguage === "hu" ? "Hibás felhasználónév vagy jelszó!" : "Invalid username or password!");
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();
        const username = document.getElementById("auth-register-username")?.value || "";
        const password = document.getElementById("auth-register-password")?.value || "";
        const passwordConfirm = document.getElementById("auth-register-password-confirm")?.value || "";
        const privacy = document.getElementById("auth-privacy-checkbox")?.checked || false;
        const error = document.getElementById("register-error");
        if (error) error.textContent = "";
        if (password !== passwordConfirm) {
            if (error) error.textContent = translations[appState.currentLanguage]?.passwordMismatch || "A két jelszó nem egyezik.";
            return;
        }
        if (!privacy) {
            if (error) error.textContent = translations[appState.currentLanguage]?.privacyRequiredError || "Az adatvédelmi tájékoztató elfogadása kötelező.";
            return;
        }
        const ok = await registerUser(username, password, passwordConfirm, privacy);
        if (!ok && error) {
            const source = document.getElementById("auth-error");
            error.textContent = source?.textContent || "Hiba történt.";
        }
    });
}

const authPrivacyLink = document.getElementById("auth-privacy-link");
if (authPrivacyLink) authPrivacyLink.addEventListener("click", () => openModal("privacy-modal"));

setAuthMode("login");

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

server.js;
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
    console.error(
        "HIBA: SESSION_SECRET nincs beállítva production módban!"
    );
    process.exit(1);
}

const sessionSecret =
    process.env.SESSION_SECRET ||
    crypto.randomBytes(32).toString("hex");

if (isProduction) {
    app.set("trust proxy", 1);
} else {
    app.set("trust proxy", false);
}

app.disable("x-powered-by");


const db = new Database(
    path.join(__dirname, "database.sqlite")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT NOT NULL DEFAULT '',
        theme TEXT NOT NULL DEFAULT 'pink-brown',
        difficulty INTEGER NOT NULL DEFAULT 5,
        privacy_accepted_at TEXT,
        joined TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS statistics (
        user_id INTEGER PRIMARY KEY,
        games_played INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        rock INTEGER NOT NULL DEFAULT 0,
        paper INTEGER NOT NULL DEFAULT 0,
        scissors INTEGER NOT NULL DEFAULT 0,
        matches_2048 INTEGER NOT NULL DEFAULT 0,
        max_score_2048 INTEGER NOT NULL DEFAULT 0,
        undos_used_2048 INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
`);

const userColumns = db
    .prepare("PRAGMA table_info(users)")
    .all()
    .map(col => col.name);

if (!userColumns.includes("difficulty")) {
    db.exec(`
        ALTER TABLE users
        ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 5
    `);
}

if (!userColumns.includes("privacy_accepted_at")) {
    db.exec(`
        ALTER TABLE users
        ADD COLUMN privacy_accepted_at TEXT
    `);
}

const statisticsColumns = db
    .prepare("PRAGMA table_info(statistics)")
    .all()
    .map(col => col.name);

if (!statisticsColumns.includes("matches_2048")) {
    db.exec(`
        ALTER TABLE statistics
        ADD COLUMN matches_2048 INTEGER NOT NULL DEFAULT 0
    `);
}

if (!statisticsColumns.includes("max_score_2048")) {
    db.exec(`
        ALTER TABLE statistics
        ADD COLUMN max_score_2048 INTEGER NOT NULL DEFAULT 0
    `);
}

if (!statisticsColumns.includes("undos_used_2048")) {
    db.exec(`
        ALTER TABLE statistics
        ADD COLUMN undos_used_2048 INTEGER NOT NULL DEFAULT 0
    `);
}


class SqliteSessionStore extends session.Store {
    constructor(client) {
        super();

        this.db = client;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                sess TEXT NOT NULL,
                expires INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_expires
            ON sessions(expires);
        `);
    }

    get(sid, callback) {
        try {
            const row = this.db
                .prepare(`
                    SELECT sess, expires
                    FROM sessions
                    WHERE sid = ?
                `)
                .get(sid);

            if (!row) {
                return callback(null, null);
            }

            if (row.expires <= Date.now()) {
                this.db
                    .prepare(`
                        DELETE FROM sessions
                        WHERE sid = ?
                    `)
                    .run(sid);

                return callback(null, null);
            }

            let parsed;

            try {
                parsed = JSON.parse(row.sess);
            } catch (error) {
                this.db
                    .prepare(`
                        DELETE FROM sessions
                        WHERE sid = ?
                    `)
                    .run(sid);

                return callback(null, null);
            }

            return callback(null, parsed);
        } catch (error) {
            return callback(error);
        }
    }

    set(sid, sess, callback) {
        try {
            const expires =
                sess.cookie && sess.cookie.expires
                    ? new Date(sess.cookie.expires).getTime()
                    : Date.now() +
                      1000 * 60 * 60 * 24 * 7;

            this.db
                .prepare(`
                    INSERT INTO sessions (
                        sid,
                        sess,
                        expires
                    )
                    VALUES (?, ?, ?)

                    ON CONFLICT(sid)
                    DO UPDATE SET
                        sess = excluded.sess,
                        expires = excluded.expires
                `)
                .run(
                    sid,
                    JSON.stringify(sess),
                    expires
                );

            if (callback) {
                callback(null);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    destroy(sid, callback) {
        try {
            this.db
                .prepare(`
                    DELETE FROM sessions
                    WHERE sid = ?
                `)
                .run(sid);

            if (callback) {
                callback(null);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    touch(sid, sess, callback) {
        this.set(sid, sess, callback);
    }

    clear(callback) {
        try {
            this.db
                .prepare("DELETE FROM sessions")
                .run();

            if (callback) {
                callback(null);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }
}

function cleanupExpiredSessions() {
    try {
        db
            .prepare(`
                DELETE FROM sessions
                WHERE expires <= ?
            `)
            .run(Date.now());
    } catch (error) {
        console.error(
            "Session cleanup error:",
            error
        );
    }
}

setInterval(
    cleanupExpiredSessions,
    1000 * 60 * 60
).unref();


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),

                "default-src": ["'self'"],

                "script-src": [
                    "'self'"
                ],

                "style-src": [
                    "'self'",
                    "'unsafe-inline'"
                ],

                "img-src": [
                    "'self'",
                    "data:",
                    "blob:"
                ],

                "font-src": [
                    "'self'",
                    "data:"
                ],

                "connect-src": [
                    "'self'"
                ],

                "object-src": [
                    "'none'"
                ],

                "base-uri": [
                    "'self'"
                ],

                "frame-ancestors": [
                    "'none'"
                ],

                "form-action": [
                    "'self'",
                    "https://formspree.io"
                ]
            }
        },

        hsts: isProduction
            ? {
                  maxAge: 31536000,
                  includeSubDomains: true,
                  preload: true
              }
            : false
    })
);

app.use(
    express.json({
        limit: "50kb",
        strict: true
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "50kb"
    })
);

const sessionStore =
    new SqliteSessionStore(db);

app.use(
    session({
        store: sessionStore,

        secret: sessionSecret,

        name: "lizugames.sid",

        resave: false,

        saveUninitialized: false,

        rolling: false,

        cookie: {
            httpOnly: true,

            secure: isProduction,

            sameSite: "lax",

            path: "/",

            maxAge:
                1000 *
                60 *
                60 *
                24 *
                7
        }
    })
);

const ALLOWED_DIFFICULTIES = [
    3,
    5,
    10
];

const DEFAULT_DIFFICULTY = 5;

const MAX_2048_UNDOS = 4;

const ALLOWED_THEMES = [
    "cream-teal",
    "wine-pink",
    "olive-cream",
    "pink-brown",
    "blue-brown",
    "yellow-plum"
];

const ALLOWED_CHOICES = [
    "rock",
    "paper",
    "scissors"
];


const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 30,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    skipSuccessfulRequests: false,

    message: {
        error:
            "Túl sok próbálkozás történt. Kérjük, próbáld újra később."
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,

    limit: 120,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        error:
            "Túl sok kérés érkezett. Kérjük, próbáld újra később."
    }
});

app.use(
    "/api/",
    apiLimiter
);

function generateCsrfToken() {
    return crypto.randomBytes(32).toString("hex");
}

function ensureCsrfToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken =
            generateCsrfToken();
    }

    return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
    const protectedMethods = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    ];

    if (
        !protectedMethods.includes(
            req.method
        )
    ) {
        return next();
    }

    const tokenFromClient =
        req.get("X-CSRF-Token");

    const tokenFromSession =
        req.session.csrfToken;

    if (
        !tokenFromClient ||
        !tokenFromSession
    ) {
        return res.status(403).json({
            error:
                "Érvénytelen vagy hiányzó CSRF token."
        });
    }

    if (
        typeof tokenFromClient !==
            "string" ||
        typeof tokenFromSession !==
            "string"
    ) {
        return res.status(403).json({
            error:
                "Érvénytelen CSRF token."
        });
    }

    const clientBuffer =
        Buffer.from(tokenFromClient);

    const sessionBuffer =
        Buffer.from(tokenFromSession);

    if (
        clientBuffer.length !==
        sessionBuffer.length
    ) {
        return res.status(403).json({
            error:
                "Érvénytelen CSRF token."
        });
    }

    if (
        !crypto.timingSafeEqual(
            clientBuffer,
            sessionBuffer
        )
    ) {
        return res.status(403).json({
            error:
                "Érvénytelen CSRF token."
        });
    }

    next();
}


function regenerateSession(req) {
    return new Promise(
        (resolve, reject) => {
            req.session.regenerate(
                error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        }
    );
}

function saveSession(req) {
    return new Promise(
        (resolve, reject) => {
            req.session.save(
                error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        }
    );
}

function destroySession(req) {
    return new Promise(
        (resolve, reject) => {
            req.session.destroy(
                error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        }
    );
}


function requireLogin(req, res, next) {
    if (
        !req.session ||
        !req.session.userId
    ) {
        return res.status(401).json({
            error:
                "Nincs bejelentkezve."
        });
    }

    next();
}

function cleanUsername(value) {
    if (
        typeof value !== "string"
    ) {
        return null;
    }

    const username =
        value.trim();

    if (
        username.length < 2 ||
        username.length > 20
    ) {
        return null;
    }


    if (
        !/^[A-Za-z0-9_]+$/.test(
            username
        )
    ) {
        return null;
    }

    return username;
}

function getStatistics(userId) {
    return db
        .prepare(`
            SELECT
                games_played,
                wins,
                losses,
                draws,
                rock,
                paper,
                scissors,
                matches_2048,
                max_score_2048,
                undos_used_2048
            FROM statistics
            WHERE user_id = ?
        `)
        .get(userId);
}

function ensureStatistics(userId) {
    let stats =
        getStatistics(userId);

    if (!stats) {
        db.prepare(`
            INSERT INTO statistics (
                user_id
            )
            VALUES (?)
        `).run(userId);

        stats =
            getStatistics(userId);
    }

    return stats;
}


function getUserDifficulty(userId) {
    const user = db
        .prepare(`
            SELECT difficulty
            FROM users
            WHERE id = ?
        `)
        .get(userId);

    if (
        user &&
        ALLOWED_DIFFICULTIES.includes(
            Number(user.difficulty)
        )
    ) {
        return Number(
            user.difficulty
        );
    }

    return DEFAULT_DIFFICULTY;
}

function getFinalResult(
    playerScore,
    computerScore
) {
    if (
        playerScore >
        computerScore
    ) {
        return "win";
    }

    if (
        computerScore >
        playerScore
    ) {
        return "loss";
    }

    return null;
}


app.get(
    "/api/csrf",
    (req, res) => {
        const csrfToken =
            ensureCsrfToken(req);

        saveSession(req)
            .then(() => {
                res.json({
                    csrfToken
                });
            })
            .catch(error => {
                console.error(
                    "CSRF save error:",
                    error
                );

                res.status(500).json({
                    error:
                        "Szerverhiba történt."
                });
            });
    }
);


app.post(
    "/api/register",
    authLimiter,
    csrfProtection,
    async (req, res) => {
        try {
            const {
                username,
                password,
                gender,
                privacyAccepted
            } = req.body;

            const cleanUser =
                cleanUsername(username);

            if (!cleanUser) {
                return res.status(400).json({
                    error:
                        "A felhasználónév 2-20 karakteres lehet, és csak betűt, számot vagy _ jelet tartalmazhat."
                });
            }

            if (
                typeof password !==
                "string"
            ) {
                return res.status(400).json({
                    error:
                        "Érvénytelen jelszó."
                });
            }

            if (
                password.length < 8 ||
                password.length > 128
            ) {
                return res.status(400).json({
                    error:
                        "A jelszónak 8-128 karakter között kell lennie."
                });
            }

            if (!privacyAccepted) {
                return res.status(400).json({
                    error:
                        "Az adatvédelmi tájékoztató elfogadása kötelező."
                });
            }

            const cleanGender =
                gender === "girl" ||
                gender === "boy"
                    ? gender
                    : "";

            const existingUser =
                db.prepare(`
                    SELECT id
                    FROM users
                    WHERE username = ?
                `).get(cleanUser);

            if (existingUser) {
                return res.status(409).json({
                    error:
                        "Ez a felhasználónév már foglalt!"
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const theme =
                cleanGender === "boy"
                    ? "blue-brown"
                    : "pink-brown";

            const joined =
                new Date()
                    .toLocaleDateString(
                        "hu-HU",
                        {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit"
                        }
                    );

            const privacyAcceptedAt =
                new Date().toISOString();

            const transaction =
                db.transaction(() => {
                    const result =
                        db.prepare(`
                            INSERT INTO users (
                                username,
                                password_hash,
                                gender,
                                theme,
                                difficulty,
                                privacy_accepted_at,
                                joined
                            )
                            VALUES (
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?
                            )
                        `).run(
                            cleanUser,
                            passwordHash,
                            cleanGender,
                            theme,
                            DEFAULT_DIFFICULTY,
                            privacyAcceptedAt,
                            joined
                        );

                    db.prepare(`
                        INSERT INTO statistics (
                            user_id
                        )
                        VALUES (?)
                    `).run(
                        result.lastInsertRowid
                    );

                    return result;
                });

            const result =
                transaction();

            await regenerateSession(req);

            req.session.userId =
                Number(
                    result.lastInsertRowid
                );

            req.session.game = null;
            req.session.game2048 = null;

            const csrfToken =
                ensureCsrfToken(req);

            await saveSession(req);

            res.json({
                success: true,

                csrfToken,

                user: {
                    username: cleanUser,
                    gender: cleanGender,
                    theme,
                    difficulty:
                        DEFAULT_DIFFICULTY,
                    joined
                }
            });
        } catch (error) {
            console.error(
                "Register error:",
                error
            );

            if (
                error &&
                error.code ===
                    "SQLITE_CONSTRAINT_UNIQUE"
            ) {
                return res.status(409).json({
                    error:
                        "Ez a felhasználónév már foglalt!"
                });
            }

            res.status(500).json({
                error:
                    "Szerverhiba történt."
            });
        }
    }
);


app.post(
    "/api/login",
    authLimiter,
    csrfProtection,
    async (req, res) => {
        try {
            const {
                username,
                password
            } = req.body;

            const cleanUser =
                cleanUsername(username);

            if (
                !cleanUser ||
                typeof password !==
                    "string"
            ) {
                return res.status(401).json({
                    error:
                        "Hibás felhasználónév vagy jelszó!"
                });
            }

            const user =
                db.prepare(`
                    SELECT
                        id,
                        username,
                        password_hash,
                        gender,
                        theme,
                        difficulty,
                        joined
                    FROM users
                    WHERE username = ?
                `).get(cleanUser);

            if (!user) {
                return res.status(401).json({
                    error:
                        "Hibás felhasználónév vagy jelszó!"
                });
            }

            const passwordCorrect =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!passwordCorrect) {
                return res.status(401).json({
                    error:
                        "Hibás felhasználónév vagy jelszó!"
                });
            }

            await regenerateSession(req);

            req.session.userId =
                user.id;

            req.session.game = null;
            req.session.game2048 = null;

            const csrfToken =
                ensureCsrfToken(req);

            await saveSession(req);

            res.json({
                success: true,

                csrfToken,

                user: {
                    username:
                        user.username,

                    gender:
                        user.gender,

                    theme:
                        user.theme,

                    difficulty:
                        user.difficulty,

                    joined:
                        user.joined
                }
            });
        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            res.status(500).json({
                error:
                    "Szerverhiba történt."
            });
        }
    }
);


app.post(
    "/api/logout",
    csrfProtection,
    requireLogin,
    async (req, res) => {
        try {
            await destroySession(req);

            res.clearCookie(
                "lizugames.sid",
                {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: "lax",
                    path: "/"
                }
            );

            res.json({
                success: true
            });
        } catch (error) {
            console.error(
                "Logout error:",
                error
            );

            res.status(500).json({
                error:
                    "Nem sikerült kijelentkezni."
            });
        }
    }
);

app.get(
    "/api/me",
    (req, res) => {
        if (
            !req.session ||
            !req.session.userId
        ) {
            return res.json({
                loggedIn: false
            });
        }

        const user =
            db.prepare(`
                SELECT
                    id,
                    username,
                    gender,
                    theme,
                    difficulty,
                    joined
                FROM users
                WHERE id = ?
            `).get(
                req.session.userId
            );

        if (!user) {
            return req.session.destroy(
                () => {
                    res.clearCookie(
                        "lizugames.sid",
                        {
                            httpOnly: true,
                            secure: isProduction,
                            sameSite: "lax",
                            path: "/"
                        }
                    );

                    res.json({
                        loggedIn: false
                    });
                }
            );
        }

        const stats =
            ensureStatistics(
                user.id
            );

        const csrfToken =
            ensureCsrfToken(req);

        res.json({
            loggedIn: true,

            csrfToken,

            user: {
                username:
                    user.username,

                gender:
                    user.gender,

                theme:
                    user.theme,

                difficulty:
                    user.difficulty,

                joined:
                    user.joined
            },

            statistics: stats
        });
    }
);

app.put(
    "/api/theme",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const {
            theme
        } = req.body;

        if (
            !ALLOWED_THEMES.includes(
                theme
            )
        ) {
            return res.status(400).json({
                error:
                    "Érvénytelen téma."
            });
        }

        db.prepare(`
            UPDATE users
            SET theme = ?
            WHERE id = ?
        `).run(
            theme,
            req.session.userId
        );

        res.json({
            success: true,
            theme
        });
    }
);


app.put(
    "/api/difficulty",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const parsedDifficulty =
            Number(
                req.body.difficulty
            );

        if (
            !ALLOWED_DIFFICULTIES.includes(
                parsedDifficulty
            )
        ) {
            return res.status(400).json({
                error:
                    "Érvénytelen nehézségi szint."
            });
        }

        db.prepare(`
            UPDATE users
            SET difficulty = ?
            WHERE id = ?
        `).run(
            parsedDifficulty,
            req.session.userId
        );

        res.json({
            success: true,
            difficulty:
                parsedDifficulty
        });
    }
);


app.post(
    "/api/game/start",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const requestedDifficulty =
            Number(
                req.body.difficulty
            );

        const targetScore =
            ALLOWED_DIFFICULTIES.includes(
                requestedDifficulty
            )
                ? requestedDifficulty
                : getUserDifficulty(
                      req.session.userId
                  );

        req.session.game = {
            playerScore: 0,
            computerScore: 0,
            targetScore,
            active: true,
            finished: false,
            settled: false,
            finalResult: null
        };

        res.json({
            success: true,
            playerScore: 0,
            computerScore: 0,
            targetScore
        });
    }
);


app.post(
    "/api/game/round",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const {
            playerChoice
        } = req.body;

        if (
            !ALLOWED_CHOICES.includes(
                playerChoice
            )
        ) {
            return res.status(400).json({
                error:
                    "Érvénytelen választás."
            });
        }

        const game =
            req.session.game;

        if (
            !game ||
            !game.active ||
            game.finished
        ) {
            return res.status(400).json({
                error:
                    "Nincs aktív játék."
            });
        }

        const computerChoice =
            ALLOWED_CHOICES[
                Math.floor(
                    Math.random() *
                        ALLOWED_CHOICES.length
                )
            ];

        let result;

        if (
            playerChoice ===
            computerChoice
        ) {
            result = "draw";
        } else if (
            (
                playerChoice ===
                    "rock" &&
                computerChoice ===
                    "scissors"
            ) ||
            (
                playerChoice ===
                    "paper" &&
                computerChoice ===
                    "rock"
            ) ||
            (
                playerChoice ===
                    "scissors" &&
                computerChoice ===
                    "paper"
            )
        ) {
            result = "win";
            game.playerScore++;
        } else {
            result = "loss";
            game.computerScore++;
        }

        db.prepare(`
            UPDATE statistics
            SET ${playerChoice} =
                ${playerChoice} + 1
            WHERE user_id = ?
        `).run(
            req.session.userId
        );

        if (result === "draw") {
            db.prepare(`
                UPDATE statistics
                SET draws = draws + 1
                WHERE user_id = ?
            `).run(
                req.session.userId
            );
        }

        const targetScore =
            game.targetScore ||
            DEFAULT_DIFFICULTY;

        const gameFinished =
            game.playerScore >=
                targetScore ||
            game.computerScore >=
                targetScore;

        let finalResult = null;

        if (gameFinished) {
            finalResult =
                getFinalResult(
                    game.playerScore,
                    game.computerScore
                );

            game.active = false;
            game.finished = true;
            game.finalResult =
                finalResult;
        }

        const updatedStats =
            getStatistics(
                req.session.userId
            );

        res.json({
            success: true,
            playerChoice,
            computerChoice,
            result,
            playerScore:
                game.playerScore,
            computerScore:
                game.computerScore,
            targetScore,
            gameFinished,
            finalResult,
            statistics:
                updatedStats
        });
    }
);


app.post(
    "/api/game/finish",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const game =
            req.session.game;

        if (
            !game ||
            !game.finished
        ) {
            return res.status(400).json({
                error:
                    "Nincs befejezett játék."
            });
        }

        if (!game.settled) {
            const finalResult =
                game.finalResult;

            if (
                finalResult !== "win" &&
                finalResult !== "loss"
            ) {
                return res.status(400).json({
                    error:
                        "Érvénytelen játékállapot."
                });
            }

            const column =
                finalResult === "win"
                    ? "wins"
                    : "losses";

            const transaction =
                db.transaction(() => {
                    db.prepare(`
                        UPDATE statistics
                        SET
                            games_played =
                                games_played + 1,

                            ${column} =
                                ${column} + 1

                        WHERE user_id = ?
                    `).run(
                        req.session.userId
                    );
                });

            transaction();

            game.settled = true;
        }

        const updatedStats =
            getStatistics(
                req.session.userId
            );

        res.json({
            success: true,
            finalResult:
                game.finalResult,
            statistics:
                updatedStats
        });
    }
);


app.post(
    "/api/game2048/start",
    csrfProtection,
    requireLogin,
    (req, res) => {
        req.session.game2048 = {
            active: true,
            undosRemaining:
                MAX_2048_UNDOS
        };

        res.json({
            success: true,
            undosRemaining:
                MAX_2048_UNDOS
        });
    }
);


app.post(
    "/api/game2048/undo",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const game =
            req.session.game2048;

        if (
            !game ||
            !game.active
        ) {
            return res.status(400).json({
                error:
                    "Nincs aktív 2048 játék."
            });
        }

        if (
            game.undosRemaining <= 0
        ) {
            return res.status(400).json({
                error:
                    "Nincs több visszavonási lehetőség ebben a meccsben."
            });
        }

        game.undosRemaining--;

        db.prepare(`
            UPDATE statistics
            SET undos_used_2048 =
                undos_used_2048 + 1
            WHERE user_id = ?
        `).run(
            req.session.userId
        );

        const updatedStats =
            getStatistics(
                req.session.userId
            );

        res.json({
            success: true,
            undosRemaining:
                game.undosRemaining,
            statistics:
                updatedStats
        });
    }
);

app.post(
    "/api/game2048/finish",
    csrfProtection,
    requireLogin,
    (req, res) => {
        const parsedScore =
            Number(req.body.score);

        if (
            !Number.isFinite(
                parsedScore
            ) ||
            parsedScore < 0 ||
            parsedScore > 1000000000
        ) {
            return res.status(400).json({
                error:
                    "Érvénytelen pontszám."
            });
        }

        const game =
            req.session.game2048;

        if (
            !game ||
            !game.active
        ) {
            return res.status(400).json({
                error:
                    "Nincs aktív 2048 játék."
            });
        }

        game.active = false;

        const current =
            db.prepare(`
                SELECT
                    max_score_2048
                FROM statistics
                WHERE user_id = ?
            `).get(
                req.session.userId
            );

        const newMax =
            Math.max(
                Number(
                    current &&
                    current.max_score_2048
                ) || 0,
                Math.round(
                    parsedScore
                )
            );

        db.prepare(`
            UPDATE statistics
            SET
                matches_2048 =
                    matches_2048 + 1,

                max_score_2048 = ?

            WHERE user_id = ?
        `).run(
            newMax,
            req.session.userId
        );

        const updatedStats =
            getStatistics(
                req.session.userId
            );

        res.json({
            success: true,
            statistics:
                updatedStats
        });
    }
);


app.delete(
    "/api/statistics/2048",
    csrfProtection,
    requireLogin,
    (req, res) => {
        db.prepare(`
            UPDATE statistics
            SET
                matches_2048 = 0,
                max_score_2048 = 0,
                undos_used_2048 = 0
            WHERE user_id = ?
        `).run(
            req.session.userId
        );

        res.json({
            success: true
        });
    }
);


app.delete(
    "/api/statistics",
    csrfProtection,
    requireLogin,
    (req, res) => {
        db.prepare(`
            UPDATE statistics
            SET
                games_played = 0,
                wins = 0,
                losses = 0,
                draws = 0,
                rock = 0,
                paper = 0,
                scissors = 0
            WHERE user_id = ?
        `).run(
            req.session.userId
        );

        res.json({
            success: true
        });
    }
);


if (isProduction) {
    app.use(
        (req, res, next) => {
            const proto =
                req.get(
                    "X-Forwarded-Proto"
                );

            if (
                proto &&
                proto
                    .split(",")[0]
                    .trim() === "http"
            ) {
                return res.redirect(
                    301,
                    "https://" +
                        req.get("host") +
                        req.originalUrl
                );
            }

            next();
        }
    );
}


app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        ),
        {
            index: "index.html",

            dotfiles: "deny",

            etag: true,

            maxAge: isProduction
                ? "1d"
                : 0
        }
    )
);


app.get(
    "/*splat",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );
    }
);


app.use(
    (error, req, res, next) => {
        console.error(
            "Unhandled error:",
            error
        );

        if (
            res.headersSent
        ) {
            return next(error);
        }

        res.status(500).json({
            error:
                "Szerverhiba történt."
        });
    }
);

const server =
    app.listen(
        PORT,
        "127.0.0.1",
        () => {
            console.log(
                `Szerver fut: http://127.0.0.1:${PORT}`
            );

            if (isProduction) {
                console.log(
                    "Production / Cloudflare proxy mód aktív."
                );
            } else {
                console.log(
                    "Development mód aktív."
                );
            }
        }
    );


function shutdown(signal) {
    console.log(
        `${signal} - leállítás...`
    );

    server.close(() => {
        try {
            db.close();
        } catch (error) {
            console.error(error);
        }

        process.exit(0);
    });
}

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);