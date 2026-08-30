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
const PORT = 3000;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

class SqliteSessionStore extends session.Store {
    constructor(client) {
        super();

        this.db = client;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                sess TEXT NOT NULL,
                expires INTEGER NOT NULL
            )
        `);
    }

    get(sid, callback) {
        try {
            const row = this.db
                .prepare("SELECT sess, expires FROM sessions WHERE sid = ?")
                .get(sid);

            if (!row) {
                return callback(null, null);
            }

            if (row.expires < Date.now()) {
                this.db
                    .prepare("DELETE FROM sessions WHERE sid = ?")
                    .run(sid);

                return callback(null, null);
            }

            return callback(null, JSON.parse(row.sess));
        } catch (error) {
            return callback(error);
        }
    }

    set(sid, sess, callback) {
        try {
            const expires =
                sess.cookie && sess.cookie.expires
                    ? new Date(sess.cookie.expires).getTime()
                    : Date.now() + 1000 * 60 * 60 * 24 * 7;

            this.db
                .prepare(`
                    INSERT INTO sessions (sid, sess, expires)
                    VALUES (?, ?, ?)
                    ON CONFLICT(sid) DO UPDATE SET
                        sess = excluded.sess,
                        expires = excluded.expires
                `)
                .run(sid, JSON.stringify(sess), expires);

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
                .prepare("DELETE FROM sessions WHERE sid = ?")
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
}

const ALLOWED_DIFFICULTIES = [3, 5, 10];
const DEFAULT_DIFFICULTY = 5;
const MAX_2048_UNDOS = 4;

const db = new Database(path.join(__dirname, "database.sqlite"));

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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

const userColumns = db
    .prepare("PRAGMA table_info(users)")
    .all()
    .map(col => col.name);

if (!userColumns.includes("difficulty")) {
    db.exec(
        `ALTER TABLE users ADD COLUMN difficulty INTEGER NOT NULL DEFAULT ${DEFAULT_DIFFICULTY}`
    );
}

if (!userColumns.includes("privacy_accepted_at")) {
    db.exec(
        "ALTER TABLE users ADD COLUMN privacy_accepted_at TEXT"
    );
}

const statisticsColumns = db
    .prepare("PRAGMA table_info(statistics)")
    .all()
    .map(col => col.name);

if (!statisticsColumns.includes("matches_2048")) {
    db.exec(
        "ALTER TABLE statistics ADD COLUMN matches_2048 INTEGER NOT NULL DEFAULT 0"
    );
}

if (!statisticsColumns.includes("max_score_2048")) {
    db.exec(
        "ALTER TABLE statistics ADD COLUMN max_score_2048 INTEGER NOT NULL DEFAULT 0"
    );
}

if (!statisticsColumns.includes("undos_used_2048")) {
    db.exec(
        "ALTER TABLE statistics ADD COLUMN undos_used_2048 INTEGER NOT NULL DEFAULT 0"
    );
}

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "form-action": ["'self'", "https://formspree.io"]
            }
        }
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET && isProduction) {
    console.error(
        "HIBA: SESSION_SECRET környezeti változó nincs beállítva production módban!"
    );
    process.exit(1);
}

app.use(
    session({
        store: new SqliteSessionStore(db),
        secret:
            process.env.SESSION_SECRET ||
            crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.USE_SECURE_COOKIE === "true",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Túl sok próbálkozás történt. Kérjük, próbáld újra 15 perc múlva."
    }
});

function ensureCsrfToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        const tokenFromClient = req.get("X-CSRF-Token");

        if (
            !tokenFromClient ||
            !req.session.csrfToken ||
            tokenFromClient !== req.session.csrfToken
        ) {
            return res.status(403).json({
                error: "Érvénytelen vagy hiányzó CSRF token."
            });
        }
    }

    next();
}

app.use(express.static(path.join(__dirname, "public")));

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
    let stats = getStatistics(userId);

    if (!stats) {
        db.prepare(`
            INSERT INTO statistics (user_id)
            VALUES (?)
        `).run(userId);

        stats = getStatistics(userId);
    }

    return stats;
}

function getFinalResult(playerScore, computerScore) {
    if (playerScore > computerScore) {
        return "win";
    }

    if (computerScore > playerScore) {
        return "loss";
    }

    return null;
}

function getUserDifficulty(userId) {
    const user = db
        .prepare("SELECT difficulty FROM users WHERE id = ?")
        .get(userId);

    if (
        user &&
        ALLOWED_DIFFICULTIES.includes(Number(user.difficulty))
    ) {
        return Number(user.difficulty);
    }

    return DEFAULT_DIFFICULTY;
}

app.post("/api/register", authLimiter, async (req, res) => {
    try {
        const {
            username,
            password,
            gender,
            privacyAccepted
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "A felhasználónév és a jelszó megadása kötelező!"
            });
        }

        const cleanUsername = username.trim();

        if (
            cleanUsername.length < 2 ||
            cleanUsername.length > 20
        ) {
            return res.status(400).json({
                error: "A felhasználónév 2-20 karakter hosszú lehet!"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "A jelszónak legalább 8 karakteresnek kell lennie!"
            });
        }

        const cleanGender =
            gender === "girl" || gender === "boy"
                ? gender
                : "";

        if (!privacyAccepted) {
            return res.status(400).json({
                error:
                    "Az adatvédelmi tájékoztató elfogadása kötelező a regisztrációhoz!"
            });
        }

        const existingUser = db
            .prepare("SELECT id FROM users WHERE username = ?")
            .get(cleanUsername);

        if (existingUser) {
            return res.status(409).json({
                error: "Ez a felhasználónév már foglalt!"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        let theme = "pink-brown";

        if (cleanGender === "boy") {
            theme = "blue-brown";
        }

        const joined = new Date().toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        const privacyAcceptedAt = new Date().toISOString();

        const result = db
            .prepare(`
                INSERT INTO users (
                    username,
                    password_hash,
                    gender,
                    theme,
                    difficulty,
                    privacy_accepted_at,
                    joined
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                cleanUsername,
                passwordHash,
                cleanGender,
                theme,
                DEFAULT_DIFFICULTY,
                privacyAcceptedAt,
                joined
            );

        db.prepare(`
            INSERT INTO statistics (user_id)
            VALUES (?)
        `).run(result.lastInsertRowid);

        req.session.userId = result.lastInsertRowid;
        req.session.game = null;
        req.session.game2048 = null;

        const csrfToken = ensureCsrfToken(req);

        res.json({
            success: true,
            csrfToken,
            user: {
                username: cleanUsername,
                gender: cleanGender,
                theme,
                difficulty: DEFAULT_DIFFICULTY,
                joined
            }
        });
    } catch (error) {
        console.error(error);

        if (
            error &&
            error.code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
            return res.status(409).json({
                error: "Ez a felhasználónév már foglalt!"
            });
        }

        res.status(500).json({
            error: "Szerverhiba történt."
        });
    }
});

app.post("/api/login", authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Add meg a felhasználónevet és a jelszót!"
            });
        }

        const user = db
            .prepare(`
                SELECT *
                FROM users
                WHERE username = ?
            `)
            .get(username.trim());

        if (!user) {
            return res.status(401).json({
                error: "Hibás felhasználónév vagy jelszó!"
            });
        }

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                error: "Hibás felhasználónév vagy jelszó!"
            });
        }

        req.session.userId = user.id;
        req.session.game = null;
        req.session.game2048 = null;

        const csrfToken = ensureCsrfToken(req);

        res.json({
            success: true,
            csrfToken,
            user: {
                username: user.username,
                gender: user.gender,
                theme: user.theme,
                difficulty: user.difficulty,
                joined: user.joined
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Szerverhiba történt."
        });
    }
});

app.post("/api/logout", csrfProtection, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                error: "Nem sikerült kijelentkezni."
            });
        }

        res.json({
            success: true
        });
    });
});

app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
        return res.json({
            loggedIn: false
        });
    }

    const user = db
        .prepare(`
            SELECT
                id,
                username,
                gender,
                theme,
                difficulty,
                joined
            FROM users
            WHERE id = ?
        `)
        .get(req.session.userId);

    if (!user) {
        req.session.destroy(() => { });

        return res.json({
            loggedIn: false
        });
    }

    const stats = ensureStatistics(user.id);
    const csrfToken = ensureCsrfToken(req);

    res.json({
        loggedIn: true,
        csrfToken,
        user: {
            username: user.username,
            gender: user.gender,
            theme: user.theme,
            difficulty: user.difficulty,
            joined: user.joined
        },
        statistics: stats
    });
});

app.put("/api/theme", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const { theme } = req.body;

    const allowedThemes = [
        "cream-teal",
        "wine-pink",
        "olive-cream",
        "pink-brown",
        "blue-brown",
        "yellow-plum"
    ];

    if (!allowedThemes.includes(theme)) {
        return res.status(400).json({
            error: "Érvénytelen téma."
        });
    }

    db.prepare(`
        UPDATE users
        SET theme = ?
        WHERE id = ?
    `).run(theme, req.session.userId);

    res.json({
        success: true,
        theme
    });
});

app.put("/api/difficulty", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const parsedDifficulty = Number(req.body.difficulty);

    if (!ALLOWED_DIFFICULTIES.includes(parsedDifficulty)) {
        return res.status(400).json({
            error: "Érvénytelen nehézségi szint."
        });
    }

    db.prepare(`
        UPDATE users
        SET difficulty = ?
        WHERE id = ?
    `).run(parsedDifficulty, req.session.userId);

    res.json({
        success: true,
        difficulty: parsedDifficulty
    });
});

app.post("/api/game/start", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const targetScore = getUserDifficulty(req.session.userId);

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
});

app.post("/api/game/round", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const { playerChoice } = req.body;

    const allowedChoices = [
        "rock",
        "paper",
        "scissors"
    ];

    if (!allowedChoices.includes(playerChoice)) {
        return res.status(400).json({
            error: "Érvénytelen választás."
        });
    }

    const game = req.session.game;

    if (!game || !game.active || game.finished) {
        return res.status(400).json({
            error: "Nincs aktív játék."
        });
    }

    const choices = [
        "rock",
        "paper",
        "scissors"
    ];

    const computerChoice =
        choices[Math.floor(Math.random() * choices.length)];

    let result;

    if (playerChoice === computerChoice) {
        result = "draw";
    } else if (
        (playerChoice === "rock" &&
            computerChoice === "scissors") ||
        (playerChoice === "paper" &&
            computerChoice === "rock") ||
        (playerChoice === "scissors" &&
            computerChoice === "paper")
    ) {
        result = "win";
        game.playerScore++;
    } else {
        result = "loss";
        game.computerScore++;
    }

    db.prepare(`
        UPDATE statistics
        SET ${playerChoice} = ${playerChoice} + 1
        WHERE user_id = ?
    `).run(req.session.userId);

    if (result === "draw") {
        db.prepare(`
            UPDATE statistics
            SET draws = draws + 1
            WHERE user_id = ?
        `).run(req.session.userId);
    }

    const targetScore =
        game.targetScore || DEFAULT_DIFFICULTY;

    const gameFinished =
        game.playerScore >= targetScore ||
        game.computerScore >= targetScore;

    let finalResult = null;

    if (gameFinished) {
        finalResult = getFinalResult(
            game.playerScore,
            game.computerScore
        );

        game.active = false;
        game.finished = true;
        game.finalResult = finalResult;
    }

    const updatedStats =
        getStatistics(req.session.userId);

    res.json({
        success: true,
        playerChoice,
        computerChoice,
        result,
        playerScore: game.playerScore,
        computerScore: game.computerScore,
        targetScore,
        gameFinished,
        finalResult,
        statistics: updatedStats
    });
});

app.post("/api/game/finish", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const game = req.session.game;

    if (!game || !game.finished) {
        return res.status(400).json({
            error: "Nincs befejezett játék."
        });
    }

    if (!game.settled) {
        const finalResult = game.finalResult;

        if (
            finalResult !== "win" &&
            finalResult !== "loss"
        ) {
            return res.status(400).json({
                error: "Érvénytelen játékállapot."
            });
        }

        const column =
            finalResult === "win"
                ? "wins"
                : "losses";

        const transaction = db.transaction(() => {
            db.prepare(`
                UPDATE statistics
                SET
                    games_played = games_played + 1,
                    ${column} = ${column} + 1
                WHERE user_id = ?
            `).run(req.session.userId);
        });

        transaction();

        game.settled = true;
    }

    const updatedStats =
        getStatistics(req.session.userId);

    res.json({
        success: true,
        finalResult: game.finalResult,
        statistics: updatedStats
    });
});

app.post("/api/game2048/start", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    req.session.game2048 = {
        active: true,
        undosRemaining: MAX_2048_UNDOS
    };

    res.json({
        success: true,
        undosRemaining: MAX_2048_UNDOS
    });
});

app.post("/api/game2048/undo", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const game = req.session.game2048;

    if (!game || !game.active) {
        return res.status(400).json({
            error: "Nincs aktív 2048 játék."
        });
    }

    if (game.undosRemaining <= 0) {
        return res.status(400).json({
            error: "Nincs több visszavonási lehetőség ebben a meccsben."
        });
    }

    game.undosRemaining -= 1;

    db.prepare(`
        UPDATE statistics
        SET undos_used_2048 = undos_used_2048 + 1
        WHERE user_id = ?
    `).run(req.session.userId);

    const updatedStats = getStatistics(req.session.userId);

    res.json({
        success: true,
        undosRemaining: game.undosRemaining,
        statistics: updatedStats
    });
});

app.post("/api/game2048/finish", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const parsedScore = Number(req.body.score);

    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
        return res.status(400).json({
            error: "Érvénytelen pontszám."
        });
    }

    const game = req.session.game2048;

    if (!game || !game.active) {
        return res.status(400).json({
            error: "Nincs aktív 2048 játék."
        });
    }

    game.active = false;

    const current = db
        .prepare("SELECT max_score_2048 FROM statistics WHERE user_id = ?")
        .get(req.session.userId);

    const newMax = Math.max(
        Number(current && current.max_score_2048) || 0,
        Math.round(parsedScore)
    );

    db.prepare(`
        UPDATE statistics
        SET
            matches_2048 = matches_2048 + 1,
            max_score_2048 = ?
        WHERE user_id = ?
    `).run(newMax, req.session.userId);

    const updatedStats = getStatistics(req.session.userId);

    res.json({
        success: true,
        statistics: updatedStats
    });
});

app.delete("/api/statistics/2048", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    db.prepare(`
        UPDATE statistics
        SET
            matches_2048 = 0,
            max_score_2048 = 0,
            undos_used_2048 = 0
        WHERE user_id = ?
    `).run(req.session.userId);

    res.json({
        success: true
    });
});

app.delete("/api/statistics", csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

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
    `).run(req.session.userId);

    res.json({
        success: true
    });
});

app.get("/{*splat}", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, () => {
    console.log(`Szerver: http://localhost:${PORT}`);
});