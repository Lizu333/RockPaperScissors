const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const session = require("express-session");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = 3000;

const db = new Database(path.join(__dirname, "database.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT NOT NULL,
        theme TEXT NOT NULL DEFAULT 'pink-brown',
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);


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
                scissors
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

app.post("/api/register", async (req, res) => {
    try {
        const { username, password, gender } = req.body;
        if (!username || !password || !gender) {
            return res.status(400).json({
                error: "Minden mező kitöltése kötelező!"
            });
        }

        const cleanUsername = username.trim();
        if (cleanUsername.length < 2 || cleanUsername.length > 20) {
            return res.status(400).json({
                error: "A felhasználónév 2-20 karakter hosszú lehet!"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "A jelszónak legalább 8 karakteresnek kell lennie!"
            });
        }

        if (gender !== "girl" && gender !== "boy") {
            return res.status(400).json({
                error: "Érvénytelen nem!"
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
        const theme = gender === "girl" ? "pink-brown" : "blue-brown";
        const joined = new Date().toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        const result = db
            .prepare(`
                INSERT INTO users (
                    username,
                    password_hash,
                    gender,
                    theme,
                    joined
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(cleanUsername, passwordHash, gender, theme, joined);

        db.prepare(`
            INSERT INTO statistics (user_id)
            VALUES (?)
        `).run(result.lastInsertRowid);

        req.session.userId = result.lastInsertRowid;
        req.session.game = null;

        res.json({
            success: true,
            user: {
                username: cleanUsername,
                gender,
                theme,
                joined
            }
        });
    } catch (error) {
        console.error(error);
        if (error && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                error: "Ez a felhasználónév már foglalt!"
            });
        }
        res.status(500).json({
            error: "Szerverhiba történt."
        });
    }
});

app.post("/api/login", async (req, res) => {
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

        res.json({
            success: true,
            user: {
                username: user.username,
                gender: user.gender,
                theme: user.theme,
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

app.post("/api/logout", (req, res) => {
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
                joined
            FROM users
            WHERE id = ?
        `)
        .get(req.session.userId);

    if (!user) {
        req.session.destroy(() => {});
        return res.json({
            loggedIn: false
        });
    }

    const stats = ensureStatistics(user.id);

    res.json({
        loggedIn: true,
        user: {
            username: user.username,
            gender: user.gender,
            theme: user.theme,
            joined: user.joined
        },
        statistics: stats
    });
});

app.put("/api/theme", (req, res) => {
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

app.post("/api/game/start", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    req.session.game = {
        playerScore: 0,
        computerScore: 0,
        active: true,
        finished: false,
        settled: false,
        finalResult: null
    };

    res.json({
        success: true,
        playerScore: 0,
        computerScore: 0
    });
});

app.post("/api/game/round", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Nincs bejelentkezve."
        });
    }

    const { playerChoice } = req.body;
    const allowedChoices = ["rock", "paper", "scissors"];

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

    const choices = ["rock", "paper", "scissors"];
    const computerChoice =
        choices[Math.floor(Math.random() * choices.length)];

    let result;
    if (playerChoice === computerChoice) {
        result = "draw";
    } else if (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) {
        result = "win";
        game.playerScore++;
    } else {
        result = "loss";
        game.computerScore++;
    }

    const choiceColumn = playerChoice;
    db.prepare(`
        UPDATE statistics
        SET ${choiceColumn} = ${choiceColumn} + 1
        WHERE user_id = ?
    `).run(req.session.userId);

    if (result === "draw") {
        db.prepare(`
            UPDATE statistics
            SET draws = draws + 1
            WHERE user_id = ?
        `).run(req.session.userId);
    }

    const gameFinished =
        game.playerScore >= 5 || game.computerScore >= 5;

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

    const updatedStats = getStatistics(req.session.userId);

    res.json({
        success: true,
        playerChoice,
        computerChoice,
        result,
        playerScore: game.playerScore,
        computerScore: game.computerScore,
        gameFinished,
        finalResult,
        statistics: updatedStats
    });
});

app.post("/api/game/finish", (req, res) => {
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
        if (finalResult !== "win" && finalResult !== "loss") {
            return res.status(400).json({
                error: "Érvénytelen játékállapot."
            });
        }

        const column = finalResult === "win" ? "wins" : "losses";
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

    const updatedStats = getStatistics(req.session.userId);

    res.json({
        success: true,
        finalResult: game.finalResult,
        statistics: updatedStats
    });
});

app.delete("/api/statistics", (req, res) => {
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


app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Szerver: http://localhost:${PORT}`);
});