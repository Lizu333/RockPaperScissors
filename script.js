let playerScore = 0;
let computerScore = 0;
let currentLanguage = "hu";
let currentTheme = "pink-brown";
let soundEnabled = true;

let statistics = 
{

    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rock: 0,
    paper: 0,
    scissors: 0
    
};


let audioCtx = null;

function initAudio() 
{

    if (!audioCtx) 
    {

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    }

    if (audioCtx.state === 'suspended') 
    {

        audioCtx.resume();

    }

}


window.addEventListener('click', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });


function playSound(type) 
{

    if (!soundEnabled)
        
        return;

    initAudio();

    if (!audioCtx)
        
        return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') 
    {

        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);

    } 
    
    else if (type === 'win') 
    {

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);

    } 
    
    else if (type === 'lose') 
    {

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);

    } 

    else if (type === 'draw') 
    {

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);

    }
    
    else if (type === 'gameover-win') 
    {

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);

    }

}

const choiceIcons = 
{

    rock: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/><path d="M11.99 22 14 12l7.822 3.184"/><path d="M14 12 8.47 2.302"/></svg>`,
    paper: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>`,
    scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`

};

const translations = 
{

    en: 
    {
        title: "Rock - Paper - Scissors",
        description: "Reach 5 points first and be the winner!",
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
        logout: "LOGOUT"
    },

    hu: 
    {
        title: "Kő - Papír - Olló",
        description: "Érd el elsőként az 5 pontot és nyerj!",
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
        resetStatistics: "STATISZTIKÁK TÖRLÉSE",
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
        logout: "KIJELENTKEZÉS"
    }

};

let currentUser = localStorage.getItem("currentUser") || null;

function getUsers() 
{

    return JSON.parse(localStorage.getItem("users") || "{}");

}

function showScreen(screenId) 
{

    document.querySelectorAll(".screen").forEach(s => 
    {

        s.classList.remove("active");
        s.classList.add("hidden");

    });

    const targetScreen = document.getElementById(screenId);

    if (targetScreen) 
    {

        targetScreen.classList.remove("hidden");
        targetScreen.classList.add("active");

    }

}

function openModal(modalId) 
{

    document.getElementById(modalId).classList.add("active");

}

function closeModal(modalId) 
{

    document.getElementById(modalId).classList.remove("active");

}

function playRound(playerChoice) 
{

    const choices = ["rock", "paper", "scissors"];
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];

    document.getElementById("player-choice").innerHTML = choiceIcons[playerChoice];
    document.getElementById("computer-choice").innerHTML = choiceIcons[computerChoice];

    document.getElementById("player-choice-name").textContent = playerChoice.toUpperCase();
    document.getElementById("computer-choice-name").textContent = computerChoice.toUpperCase();

    statistics[playerChoice]++;

    let resultText = "";

    if (playerChoice === computerChoice) 
    {
        resultText = currentLanguage === "hu" ? "Döntetlen ebben a körben!" : "It's a draw this round!";
        statistics.draws++;
        playSound('draw');
    } 

    else if 
    (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) 
    {
        playerScore++;
        resultText = currentLanguage === "hu" ? "Megnyerted ezt a kört!" : "You won this round!";
        playSound('win');
    } 

    else 
    {
        computerScore++;
        resultText = currentLanguage === "hu" ? "Elvesztetted ezt a kört!" : "You lost this round!";
        playSound('lose');
    }


    document.getElementById("player-score").textContent = playerScore;
    document.getElementById("computer-score").textContent = computerScore;
    document.getElementById("result").textContent = resultText;


    if (playerScore >= 5 || computerScore >= 5) 
    {

        finishGame();

    }

}

function resetGame() 
{

    playerScore = 0;
    computerScore = 0;

    document.getElementById("player-score").textContent = "0";
    document.getElementById("computer-score").textContent = "0";
    document.getElementById("player-choice").textContent = "?";
    document.getElementById("computer-choice").textContent = "?";
    document.getElementById("player-choice-name").textContent = translations[currentLanguage].waiting;
    document.getElementById("computer-choice-name").textContent = translations[currentLanguage].waiting;
    document.getElementById("result").textContent = translations[currentLanguage].chooseWeapon;

}

function finishGame() {
    statistics.gamesPlayed++;
    if (playerScore > computerScore) 
    {

        statistics.wins++;
        document.getElementById("end-title").textContent = currentLanguage === 
        "hu" ? "NYERTÉL!" : "YOU WIN!";

        document.getElementById("end-message").textContent = currentLanguage === 
        "hu" ? "Gratulálunk, te érted el előbb az 5 pontot!" : "Congratulations!";
        
        playSound('gameover-win');

    } 

    else   
    {
        statistics.losses++;
        document.getElementById("end-title").textContent = currentLanguage === 
        "hu" ? "VESZTETTÉL!" : "YOU LOST!";
        document.getElementById("end-message").textContent = currentLanguage === 
        "hu" ? "Az ellenfél érte el előbb az 5 pontot." : "Better luck next time!";

        playSound('lose');

    }

    document.getElementById("final-player-score").textContent = playerScore;
    document.getElementById("final-computer-score").textContent = computerScore;

    saveStatistics();
    showScreen("end-screen");

}

function registerUser(username, password) 
{

    const errorElement = document.getElementById("auth-error");
    errorElement.textContent = "";


    if (!username || username.trim() === "") 
    {
        errorElement.textContent = currentLanguage === 
        "hu" ? "Adj meg egy felhasználónevet!" : "Enter a username!";

        return;

    }

    if (password.length < 8) 
    {

        errorElement.textContent = currentLanguage === 
        "hu" ? "A jelszónak min. 8 karakternek kell lennie!" : "Password must be at least 8 chars!";

        return;

    }

    const users = getUsers();
    if (users[username]) 
    {
        errorElement.textContent = currentLanguage === 
        "hu" ? "Ez a felhasználónév már foglalt!" : "Username already taken!";
        
        return;

    }


    const genderElem = document.querySelector('input[name="gender"]:checked');
    const gender = genderElem ? genderElem.value : "girl";
    const defaultTheme = (gender === "girl") ? "pink-brown" : "blue-brown";


    const joinDate = new Date().toLocaleDateString('hu-HU', 
    {

        year: 'numeric', month: '2-digit', day: '2-digit'

    });

    users[username] = 
    {

        password: password,
        gender: gender,
        theme: defaultTheme,
        joined: joinDate

    };

    localStorage.setItem("users", JSON.stringify(users));

    const userStats = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rock: 0, paper: 0, scissors: 0 };
    localStorage.setItem(`stats_${username}`, JSON.stringify(userStats));

    loginUser(username, password);

}

function loginUser(username, password) 
{

    const errorElement = document.getElementById("auth-error");
    const users = getUsers();


    if (!users[username] || users[username].password !== password) 
    {
        errorElement.textContent = currentLanguage ===
        "hu" ? "Hibás felhasználónév vagy jelszó!" : "Invalid username or password!";

        return;

    }

    currentUser = username;
    localStorage.setItem("currentUser", username);

    if (users[username].theme) {
        setTheme(users[username].theme);
    }

    loadUserStatistics(username);
    updateProfileUI();
}

function logoutUser() 
{

    currentUser = null;
    localStorage.removeItem("currentUser");
    statistics = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rock: 0, paper: 0, scissors: 0 };

    updateProfileUI();

}

function loadUserStatistics(username) 
{
    if (!username)
    return;

    const savedStats = localStorage.getItem(`stats_${username}`);

    if (savedStats) statistics = JSON.parse(savedStats);

    updateStatisticsUI();

}

function saveStatistics() 
{
    if (currentUser) 
    {

        localStorage.setItem(`stats_${currentUser}`, JSON.stringify(statistics));

    }

}

function updateProfileUI() 
{

    const authForms = document.getElementById("auth-forms");
    const loggedInView = document.getElementById("logged-in-view");
    const currentUsernameElem = document.getElementById("current-username");
    const joinDateElem = document.getElementById("user-join-date");


    if (currentUser) 
    {
        authForms.style.display = "none";
        loggedInView.style.display = "block";
        currentUsernameElem.textContent = currentUser;

        const users = getUsers();

        if (users[currentUser] && users[currentUser].joined) 
        {

            joinDateElem.textContent = users[currentUser].joined;

        } 
        
        else 
        {

            joinDateElem.textContent = "-";

        }

        updateStatisticsUI();
    } 
    
    else 
    {

        authForms.style.display = "block";
        loggedInView.style.display = "none";

    }

}

function setTheme(themeKey) 
{
    currentTheme = themeKey;
    document.body.setAttribute("data-theme", themeKey);
    localStorage.setItem("gameTheme", themeKey);

    if (currentUser) 
    {
        const users = getUsers();
        if (users[currentUser]) 
        {

            users[currentUser].theme = themeKey;
            localStorage.setItem("users", JSON.stringify(users));

        }

    }

}

function setLanguage(lang) 
{

    currentLanguage = lang;
    document.querySelectorAll("[data-i18n]").forEach(elem => 
    {

        const key = elem.dataset.i18n;

        if (translations[lang] && translations[lang][key]) 
        {

            elem.textContent = translations[lang][key];

        }

    });

    document.querySelectorAll(".setting-lang-btn").forEach(btn => 
    {

        btn.classList.toggle("active", btn.dataset.settingLang === lang);

    });

}

function updateStatisticsUI() 
{

    document.getElementById("games-played").textContent = statistics.gamesPlayed;
    document.getElementById("total-wins").textContent = statistics.wins;
    document.getElementById("total-losses").textContent = statistics.losses;
    document.getElementById("total-draws").textContent = statistics.draws;
    document.getElementById("rock-used").textContent = statistics.rock;
    document.getElementById("paper-used").textContent = statistics.paper;
    document.getElementById("scissors-used").textContent = statistics.scissors;

    const winRate = statistics.gamesPlayed > 0 
        ? Math.round((statistics.wins / statistics.gamesPlayed) * 100) 
        : 0;

    document.getElementById("win-rate").textContent = `${winRate}%`;

}


document.querySelectorAll("button").forEach(btn => 
{

    btn.addEventListener("click", (e) => 
    {

        if (btn.id !== "sound-toggle") 
        {
            playSound('click');
        }

    });

});

document.getElementById("lang-modal-btn").addEventListener("click", () => openModal("settings-modal"));
document.getElementById("theme-modal-btn").addEventListener("click", () => openModal("settings-modal"));
document.getElementById("start-btn").addEventListener("click", () => 
{

    resetGame();
    showScreen("game-screen");

});

document.getElementById("profile-btn").addEventListener("click", () => 
{

    updateProfileUI();
    openModal("profile-modal");

});


document.getElementById("settings-btn").addEventListener("click", () => openModal("settings-modal"));


const menuGameBtn = document.getElementById("menu-game-btn");
if (menuGameBtn) 
{

    menuGameBtn.addEventListener("click", () => showScreen("start-screen"));

}

const menuBtn = document.getElementById("menu-btn");
if (menuBtn) 
{

    menuBtn.addEventListener("click", () => showScreen("start-screen"));

}


document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("play-again-btn").addEventListener("click", () => 
{

    resetGame();
    showScreen("game-screen");

});

document.querySelectorAll(".choice-btn").forEach(btn => 
{

    btn.addEventListener("click", () => playRound(btn.dataset.choice));

});

document.querySelectorAll(".modal-close, .close-settings-btn").forEach(btn =>
{
    btn.addEventListener("click", () => 
    {

        const modalId = btn.dataset.close;
        if (modalId) closeModal(modalId);

    });

});


document.querySelectorAll(".theme-preset-btn").forEach(btn => 
{

    btn.addEventListener("click", () => setTheme(btn.dataset.theme));

});


document.querySelectorAll(".setting-lang-btn").forEach(btn => 
{

    btn.addEventListener("click", () => setLanguage(btn.dataset.settingLang));

});


document.getElementById("sound-toggle").addEventListener("click", () => 
{

    if (!soundEnabled) 
    {
        soundEnabled = true;
        playSound('click');

    } 
    
    else 
    {

        soundEnabled = false;

    }
    
    document.getElementById("sound-toggle-text").textContent = soundEnabled 
        ? translations[currentLanguage].on 
        : translations[currentLanguage].off;

});

document.getElementById("register-btn").addEventListener("click", () => 
{

    const u = document.getElementById("username-input").value;
    const p = document.getElementById("password-input").value;

    registerUser(u, p);

});

document.getElementById("login-btn").addEventListener("click", () => 
{

    const u = document.getElementById("username-input").value;
    const p = document.getElementById("password-input").value;
   
    loginUser(u, p);

});

document.getElementById("logout-btn").addEventListener("click", logoutUser);

document.getElementById("reset-statistics-btn").addEventListener("click", () => 
{

    statistics = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rock: 0, paper: 0, scissors: 0 };
   
    saveStatistics();
    updateStatisticsUI();

});

document.getElementById("report-modal-btn").addEventListener("click", () => openModal("report-modal"));
document.getElementById("privacy-modal-btn").addEventListener("click", () => openModal("privacy-modal"));


const savedTheme = localStorage.getItem("gameTheme") || "pink-brown";
setTheme(savedTheme);
setLanguage("hu");

if (currentUser) loadUserStatistics(currentUser);