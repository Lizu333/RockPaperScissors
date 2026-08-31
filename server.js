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

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    console.error(
        "HIBA: Production módban legalább 32 karakteres SESSION_SECRET szükséges!"
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

        rolling: true,

        cookie: {
            httpOnly: true,

            secure: isProduction || process.env.USE_SECURE_COOKIE === "true",

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

const sitePasswordHash = String(process.env.SITE_PASSWORD_HASH || "").trim();

if (isProduction && !sitePasswordHash) {
    console.error("HIBA: Production módban SITE_PASSWORD_HASH szükséges!");
    process.exit(1);
}

const sitePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: {
        error: "Túl sok próbálkozás történt. Kérjük, próbáld újra később."
    }
});

function isSiteUnlocked(req) {
    return Boolean(req.session && req.session.siteUnlocked === true);
}

function siteLockPage(errorMessage = "") {
    const safeError = String(errorMessage || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LizuGames</title>
<meta name="robots" content="noindex,nofollow,noarchive">
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4e8e1;color:#4b342b;padding:24px}.card{width:min(460px,100%);background:#fffaf7;border-radius:24px;padding:42px;box-shadow:0 20px 60px rgba(60,35,25,.16);text-align:center}.logo{font-size:34px;font-weight:800;margin-bottom:18px}.title{font-size:23px;font-weight:700;margin-bottom:10px}.text{line-height:1.5;margin-bottom:25px;color:#70564b}.input{width:100%;padding:15px 16px;border:1px solid #d8c2b8;border-radius:12px;background:#fff;font-size:16px;outline:none}.input:focus{border-color:#9b725f;box-shadow:0 0 0 3px rgba(155,114,95,.15)}.button{width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#6d4a3b;color:#fff;font-size:16px;font-weight:700;cursor:pointer}.button:hover{filter:brightness(.96)}.error{min-height:22px;margin-top:14px;color:#a33a32;font-size:14px}
</style>
</head>
<body>
<main class="card">
<div class="logo">LizuGames</div>
<div class="title">Az oldalra való továbblépéshez írd be a jelszót</div>
<div class="text">Az oldal jelenleg jelszóval védett.</div>
<form method="post" action="/api/site-unlock" autocomplete="off">
<input class="input" type="password" name="password" placeholder="Oldaljelszó" autocomplete="current-password" required maxlength="128" autofocus>
<button class="button" type="submit">TOVÁBB AZ OLDALRA</button>
<div class="error">${safeError}</div>
</form>
</main>
</body>
</html>`;
}

app.get("/api/site-status", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ unlocked: isSiteUnlocked(req) });
});

app.post("/api/site-unlock", sitePasswordLimiter, async (req, res) => {
    try {
        if (!sitePasswordHash) {
            return res.status(503).send("Az oldal jelszavas védelme nincs konfigurálva.");
        }

        if (typeof req.body.password !== "string" || req.body.password.length === 0 || req.body.password.length > 128) {
            return res.status(400).send(siteLockPage("Érvénytelen jelszó."));
        }

        const correct = await bcrypt.compare(req.body.password, sitePasswordHash);

        if (!correct) {
            return res.status(401).send(siteLockPage("Hibás jelszó."));
        }

        await regenerateSession(req);
        req.session.siteUnlocked = true;
        req.session.userId = null;
        req.session.game = null;
        req.session.game2048 = null;
        ensureCsrfToken(req);
        await saveSession(req);

        return res.redirect(303, "/");
    } catch (error) {
        console.error("Site unlock error:", error);
        return res.status(500).send(siteLockPage("Szerverhiba történt."));
    }
});

function requireSiteUnlock(req, res, next) {
    if (isSiteUnlocked(req)) {
        return next();
    }

    if (req.path.startsWith("/api/")) {
        return res.status(403).json({
            error: "Az oldal használatához először fel kell oldani az oldal jelszavát.",
            siteLocked: true
        });
    }

    const acceptsHtml = String(req.get("accept") || "").includes("text/html");

    if (!acceptsHtml) {
        return res.status(403).send("Az oldal jelszóval védett.");
    }

    return res.status(401).send(siteLockPage());
}

app.use(requireSiteUnlock);

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
                res.set("Cache-Control", "no-store");

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
                passwordConfirm,
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

            if (
                typeof passwordConfirm !== "string" ||
                password !== passwordConfirm
            ) {
                return res.status(400).json({
                    error:
                        "A két jelszó nem egyezik."
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

            const siteUnlocked =
                isSiteUnlocked(req);

            await regenerateSession(req);

            req.session.siteUnlocked =
                siteUnlocked;

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

            const siteUnlocked =
                isSiteUnlocked(req);

            await regenerateSession(req);

            req.session.siteUnlocked =
                siteUnlocked;

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
            const siteUnlocked =
                isSiteUnlocked(req);

            await regenerateSession(req);

            req.session.siteUnlocked =
                siteUnlocked;

            req.session.userId = null;
            req.session.game = null;
            req.session.game2048 = null;

            ensureCsrfToken(req);

            await saveSession(req);

            res.json({
                success: true,
                csrfToken:
                    req.session.csrfToken
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
        "0.0.0.0",
        () => {
            console.log(
                `Szerver fut: ${PORT}`
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