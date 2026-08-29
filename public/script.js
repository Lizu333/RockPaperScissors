let playerScore = 0;
let computerScore = 0;

let currentLanguage = "hu";
let currentTheme = "pink-brown";
let currentDifficulty = 5;
let currentTargetScore = 5;
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

let pendingConfirmAction = null;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function initAudio() {
    if (!audioCtx) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

window.addEventListener("click", initAudio, { once: true });
window.addEventListener("keydown", initAudio, { once: true });


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
        osc.frequency.setValueAtTime(500, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);

    } else if (type === "win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);

    } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === "draw") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);

    } else if (type === "gameover-win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);

    } else if (type === "computer") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(620, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }
}


const choiceIcons = {
    rock: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
            <path d="M11.99 22 14 12l7.822 3.184"/>
            <path d="M14 12 8.47 2.302"/>
        </svg>
    `,

    paper: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <path d="M15 12h-5"/>
            <path d="M15 8h-5"/>
            <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
            <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a2 2 0 0 0-2 2v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>
        </svg>
    `,

    scissors: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="28"
             height="28"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <path d="M8.12 8.12 12 12"/>
            <path d="M20 4 8.12 15.88"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M14.8 14.8 20 20"/>
        </svg>
    `
};


const translations = {
    en: {
        title: "Rock - Paper - Scissors",
        description: "Reach the target score first and be the winner!",
        siteTitle: "LizuGames",
        selectGame: "Choose a game",
        rpsTitle: "Rock - Paper - Scissors",
        rpsDescription: "Reach the target score first!",
        game2048Title: "2048",
        game2048Description: "Reach 2048!",
        comingSoon: "COMING SOON",
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
        difficulty: "DIFFICULTY",
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
        genderNone: "Prefer not to say",
        genderOptionalNote: "Specifying your gender is optional.",
        privacyCheckboxLabel:
            "I have read and acknowledge the Privacy Policy.",
        privacyCheckboxLink: "View Privacy Notice",
        privacyRequiredError:
            "You must acknowledge the Privacy Policy to register.",
        confirmLogout: "Are you sure you want to log out?",
        confirmResetStats:
            "Are you sure you want to delete your statistics history?",
        targetScoreLabel: "Target:",
        logout: "LOGOUT",
        computerChoosing: "Computer is choosing...",
        reveal: "REVEAL!",
        roundWin: "You won this round!",
        roundLoss: "You lost this round!",
        roundDraw: "It's a draw this round!",
        moreAboutCreator: "More about the creator",
        reportTitle: "REPORT A BUG",
        reportDescription:
            "If you experienced a bug in the game, let us know!",
        send: "SEND",
        privacyTitle: "PRIVACY POLICY",
        privacyText: `
            <p>
                This notice, based on Regulation (EU) 2016/679 of the European Parliament and of the Council
                (GDPR) and the relevant provisions of Hungarian Act C of 2003 on Electronic Communications,
                describes what personal data we process when you use the Rock-Paper-Scissors game ("Game"),
                for what purpose and on what legal basis, for how long we store it, and what rights you have
                as a data subject.
            </p>

            <br>

            <p><strong>1. Data controller</strong></p>

            <p>
                The data controller is the developer of the Game: Lilla Kecskés.
                <br>
                Contact: klizu333@gmail.com
                <br>
                GitHub: github.com/Lizu333
            </p>

            <br>

            <p><strong>2. Data processed, purposes and legal bases</strong></p>

            <p>
                a) Data required for registration (username, password hash): purpose is to create your
                account and enable login. Legal basis: GDPR Art. 6(1)(b) - necessary for the performance of a
                contract to which you, as the data subject, are party (provision of the Game's services).
            </p>
            <br>
            <p>
                b) Optionally provided data (gender): purpose is to personalize the user interface (e.g. the
                default theme). Legal basis: GDPR Art. 6(1)(a) - your explicit consent, given voluntarily by
                providing the data, which you may withdraw at any time, without giving a reason, using the
                contact details in Section 1, without affecting the lawfulness of processing carried out
                before the withdrawal.
            </p>
            <br>
            <p>
                c) Settings and game data (selected theme, difficulty level, game statistics - wins, losses,
                draws, number of rock/paper/scissors choices): purpose is to provide gameplay and a
                personalized experience. Legal basis: GDPR Art. 6(1)(b).
            </p>
            <br>
            <p>
                d) The date your account was created (registration), and the fact and time you read and
                acknowledged this notice: purpose is to comply with the accountability principle
                (GDPR Art. 5(2)), i.e. to demonstrate that your consent and the information provided were
                properly recorded. Legal basis: GDPR Art. 6(1)(c), compliance with a legal obligation to which
                the controller is subject.
            </p>
            <br>
            <p>
                e) Session identifier (session cookie): purpose is to technically maintain your logged-in
                state. Legal basis: GDPR Art. 6(1)(f), the controller's legitimate interest in keeping you
                logged in after closing the browser. See Section 3 for details.
            </p>
            <br>
            <p>
                f) Email address and message text provided when reporting a bug: processed only if you
                voluntarily submit the "Report a bug" form. Purpose is to investigate the reported issue and
                contact you if needed. Legal basis: GDPR Art. 6(1)(a), the consent given by submitting the
                form.
            </p>

            <br>

            <p><strong>3. Cookies and similar technologies</strong></p>

            <p>
                The Game uses a single, strictly necessary session cookie to keep you logged in. The cookie
                contains only a random identifier; its purpose is to recognize your logged-in state, and it is
                not used for tracking, profiling, or third-party advertising. The cookie is only accessible
                over HTTP (HttpOnly), and the browser only sends it with same-site requests (SameSite=Lax). It
                is valid for a maximum of 7 days, or until you log out. Because this cookie is strictly
                necessary for the core functioning of the Game (logging in), no separate consent is required
                for its use under the Hungarian Electronic Communications Act.
            </p>

            <p>
                In addition, your browser saves your most recently selected language and theme in local
                storage (localStorage) on your own device, so the page loads with these settings next time.
                This data is not sent to our server, unless you log in and also save the theme to your
                profile.
            </p>

            <br>

            <p><strong>4. How your password is stored</strong></p>

            <p>
                Your password is never stored in plain text. During registration, the server transforms the
                password you provide using the bcrypt algorithm with secure hashing, and only the resulting
                password hash is stored in the database. We do not know your original password and cannot
                recover it in any form.
            </p>

            <br>

            <p><strong>5. Security measures</strong></p>

            <p>
                Passwords are stored using bcrypt hashing, the session cookie is protected with HttpOnly and
                SameSite settings, and only the controller has access to the Game's database. The purpose of
                these measures is to protect your data, to the extent reasonably expected given the current
                state of technology, from unauthorized access, alteration, disclosure, or destruction.
            </p>

            <br>

            <p><strong>6. Where and how long your data is stored</strong></p>

            <p>
                Your data is stored on the Game's server in an SQLite database. The Game's server application
                runs on the Render platform. The session identifier is valid for a maximum of 7 days, or until
                you log out. Other data related to your account and statistics is stored until your account
                is deleted, or until you request deletion in writing (at the email address given in Section
                1); upon receiving such a request, we will delete your data without undue delay. In operating
                the hosting service, Render may also record technical log data (e.g. the IP address and time
                of requests made to the server), in accordance with its own privacy policy, solely for
                operational and security purposes.
            </p>

            <br>

            <p><strong>7. Bug reports, the Formspree service, and international data transfer</strong></p>

            <p>
                When you send a message through the "Report a bug" form, the email address and message text
                you provide are forwarded to the controller via the Formspree Inc. service, solely for the
                purpose of resolving the issue.
            </p>

            <p>
                Important: this transfer takes place outside the European Economic Area (EEA), to the United
                States. According to its own information, Formspree applies appropriate safeguards to protect
                the transferred data.
            </p>

            <p>
                <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
                    Formspree Privacy Policy
                </a>
            </p>

            <br>

            <p><strong>8. Automated decision-making and profiling</strong></p>

            <p>
                In operating the Game, we do not use decision-making based solely on automated processing -
                including profiling - within the meaning of GDPR Art. 22, which would produce legal effects
                concerning you or similarly significantly affect you.
            </p>

            <br>

            <p><strong>9. Your rights as a data subject</strong></p>

            <p>
                Under the GDPR, you may request access to your personal data, its rectification, erasure
                ("right to be forgotten"), and restriction of processing; you may object to processing; and,
                where applicable, request the portability of your data. Where processing is based solely on
                consent (e.g. providing your gender), you may withdraw your consent at any time, without
                giving a reason, without affecting the lawfulness of processing carried out before the
                withdrawal.
            </p>

            <p>
                You may exercise these rights with the controller at klizu333@gmail.com. If you believe that
                the processing of your data is unlawful, you may lodge a complaint with the Hungarian National
                Authority for Data Protection and Freedom of Information (NAIH), or turn to the competent
                court to enforce your rights.
            </p>

            <p>
                NAIH contact details: registered seat: 1055 Budapest, Falk Miksa utca 9-11., Hungary; postal
                address: 1363 Budapest, Pf.: 9., Hungary; phone: +36 (1) 391-1400; email:
                ugyfelszolgalat@naih.hu; website: www.naih.hu.
            </p>

            <br>

            <p><strong>10. Minors</strong></p>

            <p>
                If the Game is used by a person under the age of 16, we recommend that registration be carried
                out under the supervision and with the approval of a parent or legal guardian.
            </p>

            <br>

            <p><strong>11. Changes to this notice</strong></p>

            <p>
                We may update this notice as the Game is developed further or as the legal environment
                changes. The currently applicable version is always available within the Game, on this page.
                This version of the notice takes effect as of August 29, 2026.
            </p>
        `
    },

    hu: {
        title: "Kő - Papír - Olló",
        description: "Érd el elsőként a célpontszámot és nyerj!",
        siteTitle: "LizuGames",
        selectGame: "Válassz egy játékot!",
        rpsTitle: "Kő - Papír - Olló",
        rpsDescription: "Érd el elsőként a célpontszámot!",
        game2048Title: "2048",
        game2048Description: "Érd el a 2048-at!",
        comingSoon: "HAMAROSAN",
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
        difficulty: "NEHÉZSÉGI SZINT",
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
        genderNone: "Nem adom meg",
        genderOptionalNote: "A nemed megadása opcionális.",
        privacyCheckboxLabel:
            "Elolvastam és tudomásul vettem az adatvédelmi tájékoztatót.",
        privacyCheckboxLink:
            "Adatvédelmi tájékoztató megtekintése",
        privacyRequiredError:
            "Az adatvédelmi tájékoztató megtekintése kötelező a regisztrációhoz!",
        confirmLogout: "Biztos kilépsz?",
        confirmResetStats:
            "Biztos törlöd a statisztikai előzményeket?",
        targetScoreLabel: "Cél:",
        logout: "KIJELENTKEZÉS",
        computerChoosing: "A gép választ...",
        reveal: "FELFEDÉS!",
        roundWin: "Megnyerted ezt a kört!",
        roundLoss: "Elvesztetted ezt a kört!",
        roundDraw: "Döntetlen ebben a körben!",
        moreAboutCreator: "Tudj meg többet a készítőről",
        reportTitle: "HIBABEJELENTÉS",
        reportDescription:
            "Ha hibát tapasztaltál a játékban, írd meg nekünk!",
        send: "KÜLDÉS",
        privacyTitle: "ADATVÉDELMI TÁJÉKOZTATÓ",
        privacyText: `
            <p>
                Jelen tájékoztató az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR), valamint az
                elektronikus hírközlésről szóló 2003. évi C. törvény vonatkozó rendelkezései alapján
                ismerteti, hogy a Kő-Papír-Olló játék ("Játék") használata során milyen személyes adatokat
                kezelünk, milyen célból és jogalapon, meddig tároljuk azokat, valamint milyen jogok illetnek
                meg téged adatkezelés érintettjeként.
            </p>

            <br>

            <p><strong>1. Az adatkezelő</strong></p>

            <p>
                Az adatkezelő a Játék fejlesztője: Kecskés Lilla.
                <br>
                Kapcsolat: klizu333@gmail.com
                <br>
                GitHub: github.com/Lizu333
            </p>

            <br>

            <p><strong>2. Kezelt adatok, célok és jogalapok</strong></p>

            <p>
                a) Regisztrációhoz kötelezően szükséges adatok (felhasználónév, jelszó kivonata): cél a fiók
                létrehozása és a bejelentkezés lehetővé tétele. Jogalap: a GDPR 6. cikk (1) bekezdés b) pontja -
                a veled mint érintettel kötött szerződés (a Játék szolgáltatásainak nyújtása) teljesítéséhez
                szükséges.
            </p>
            <br>
            <p>
                b) Opcionálisan megadható adat (nem): cél a felhasználói felület (pl. az alapértelmezett téma)
                személyre szabása. Jogalap: a GDPR 6. cikk (1) bekezdés a) pontja - kifejezett hozzájárulásod,
                amelyet a megadással önkéntesen adsz meg, és amelyet bármikor, indoklás nélkül visszavonhatsz
                az 1. pontban megadott elérhetőségen keresztül, a hozzájárulás visszavonása előtt végzett
                adatkezelés jogszerűségének érintése nélkül.
            </p>
            <br>
            <p>
                c) Beállítások és játékadatok (kiválasztott téma, nehézségi szint, játékstatisztikák -
                győzelmek, vereségek, döntetlenek, kő/papír/olló választások száma): cél a játékmenet és a
                személyre szabott élmény biztosítása. Jogalap: a GDPR 6. cikk (1) bekezdés b) pontja.
            </p>
            <br>
            <p>
                d) A fiók létrehozásának (regisztráció) dátuma, valamint a jelen tájékoztató elolvasásának és
                tudomásulvételének ténye és időpontja: cél az elszámoltathatóság elvének (GDPR 5. cikk (2)
                bekezdés) teljesítése, vagyis annak igazolása, hogy a hozzájárulásodat és a tájékoztatást
                megfelelően rögzítettük. Jogalap: a GDPR 6. cikk (1) bekezdés c) pontja, az adatkezelőre
                vonatkozó jogi kötelezettség teljesítése.
            </p>
            <br>
            <p>
                e) Munkamenet-azonosító (session cookie): cél a bejelentkezett állapot technikai fenntartása.
                Jogalap: a GDPR 6. cikk (1) bekezdés f) pontja, az adatkezelő azon jogos érdeke, hogy a
                bejelentkezés a böngésző bezárása után is fennmaradjon. Bővebben a 3. pontban.
            </p>
            <br>
            <p>
                f) Hibabejelentés esetén megadott e-mail cím és üzenetszöveg: kizárólag akkor kezeljük, ha a
                "Hibabejelentés" űrlapot kitöltve önként elküldöd. Cél a bejelentett hiba kivizsgálása és a
                veled történő kapcsolatfelvétel. Jogalap: a GDPR 6. cikk (1) bekezdés a) pontja, az űrlap
                elküldésével megadott hozzájárulásod.
            </p>

            <br>

            <p><strong>3. Sütik (cookie-k) és hasonló technológiák</strong></p>

            <p>
                A Játék a bejelentkezés fenntartásához egyetlen, kizárólag technikailag szükséges
                munkamenet-sütit használ. A süti kizárólag egy véletlenszerű azonosítót tartalmaz, célja a
                bejelentkezett állapot felismerése, és nem szolgál nyomkövetésre, profilalkotásra vagy
                harmadik fél általi hirdetési célra. A süti csak HTTP-n keresztül érhető el (HttpOnly), és a
                böngésző csak azonos oldali kéréseknél küldi el (SameSite=Lax). Érvényessége legfeljebb 7 nap,
                illetve a kijelentkezésig tart. Mivel a süti a Játék alapvető működéséhez (a bejelentkezéshez)
                elengedhetetlenül szükséges, használatához az elektronikus hírközlésről szóló törvény alapján
                nem szükséges külön hozzájárulásod.
            </p>

            <p>
                Emellett a böngésződ a saját eszközödön, a böngésző helyi tárolójában (localStorage) menti a
                legutóbb kiválasztott nyelvet és témát, hogy legközelebb is ezekkel a beállításokkal töltsön
                be az oldal. Ez az adat nem kerül elküldésre a szerverünk felé, kivéve, ha bejelentkezel, és a
                témát a profilodhoz is elmented.
            </p>

            <br>

            <p><strong>4. A jelszó tárolásának módja</strong></p>

            <p>
                A jelszavadat nem szöveges formában tároljuk. A regisztráció során megadott jelszót a szerver
                bcrypt algoritmussal, biztonságos hash-eléssel alakítja át, és kizárólag az így létrehozott
                jelszó-kivonatot tároljuk az adatbázisban. Az eredeti jelszavadat nem ismerjük, és azt
                semmilyen formában nem tudjuk visszaállítani.
            </p>

            <br>

            <p><strong>5. Adatbiztonsági intézkedések</strong></p>

            <p>
                A jelszavak bcrypt hash-eléssel kerülnek tárolásra, a munkamenet-süti HttpOnly és SameSite
                beállításokkal védett, és a Játék adatbázisához kizárólag az adatkezelő fér hozzá. Ezen
                intézkedések célja, hogy a technika mindenkori állása szerint elvárható szinten védjék az
                adataidat a jogosulatlan hozzáféréstől, módosítástól, nyilvánosságra hozataltól vagy
                megsemmisítéstől.
            </p>

            <br>

            <p><strong>6. Az adatok tárolásának helye és időtartama</strong></p>

            <p>
                Az adatok a Játék szerverén, egy SQLite adatbázisban kerülnek tárolásra. A Játék
                szerveralkalmazása a Render szolgáltatásán fut. A munkamenet-azonosító legfeljebb 7 napig,
                illetve a kijelentkezésig érvényes. A fiókodhoz és a statisztikáidhoz kapcsolódó egyéb
                adataidat a fiókod törléséig, vagy a törlés írásban (az 1. pontban megadott e-mail címen)
                történő kéréséig tároljuk; a kérés beérkezését követően az adataidat indokolatlan késedelem
                nélkül töröljük. A tárhelyszolgáltatás üzemeltetése során a Render technikai jellegű
                naplóadatokat (pl. a szerverhez intézett kérések IP-címe, időpontja) is rögzíthet, a saját
                adatvédelmi szabályzata szerint, kizárólag üzemeltetési és biztonsági célból.
            </p>

            <br>

            <p><strong>7. Hibabejelentés, a Formspree szolgáltatás és nemzetközi adattovábbítás</strong></p>

            <p>
                Amikor a "Hibabejelentés" űrlapon keresztül üzenetet küldesz, a megadott e-mail címedet és az
                üzenet szövegét a Formspree Inc. szolgáltatásán keresztül továbbítjuk az adatkezelőnek,
                kizárólag a hiba elhárítása céljából.
            </p>

            <p>
                Fontos: ez az adattovábbítás az Európai Gazdasági Térségen (EGT) kívülre, az Amerikai Egyesült
                Államokba történik. A Formspree saját tájékoztatása szerint megfelelő garanciákat alkalmaz a
                továbbított adatok védelmére.
            </p>

            <p>
                <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
                    Formspree Adatvédelmi Tájékoztató
                </a>
            </p>

            <br>

            <p><strong>8. Automatizált döntéshozatal és profilalkotás</strong></p>

            <p>
                A Játék működése során nem alkalmazunk a GDPR 22. cikke szerinti, kizárólag automatizált
                adatkezelésen - ideértve a profilalkotást is - alapuló döntéshozatalt, amely rád nézve
                joghatással járna vagy téged hasonlóképpen jelentős mértékben érintene.
            </p>

            <br>

            <p><strong>9. Az érintett jogai</strong></p>

            <p>
                A GDPR alapján kérheted személyes adataidhoz való hozzáférést, azok helyesbítését, törlését
                ("elfeledtetéshez való jog"), az adatkezelés korlátozását, valamint tiltakozhatsz az adatkezelés
                ellen, illetve - ahol ez alkalmazandó - kérheted adataid hordozhatóságát. A kizárólag
                hozzájáruláson alapuló adatkezelés (pl. a nem megadása) esetén a hozzájárulásodat bármikor,
                indoklás nélkül visszavonhatod, ez azonban nem érinti a visszavonás előtti adatkezelés
                jogszerűségét.
            </p>

            <p>
                E jogaidat az adatkezelőnél, a klizu333@gmail.com címen gyakorolhatod. Amennyiben úgy ítéled
                meg, hogy adataid kezelése jogsértő, panaszt nyújthatsz be a Nemzeti Adatvédelmi és
                Információszabadság Hatóságnál (NAIH), vagy jogaid megsértése esetén az illetékes bírósághoz
                fordulhatsz.
            </p>

            <p>
                A NAIH elérhetőségei: székhely: 1055 Budapest, Falk Miksa utca 9-11.; postacím: 1363
                Budapest, Pf.: 9.; telefon: +36 (1) 391-1400; e-mail: ugyfelszolgalat@naih.hu; honlap:
                www.naih.hu.
            </p>

            <br>

            <p><strong>10. Kiskorúak</strong></p>

            <p>
                Amennyiben a Játékot 16 év alatti személy használja, javasoljuk, hogy a regisztrációt szülő vagy
                törvényes képviselő felügyelete és jóváhagyása mellett végezze el.
            </p>

            <br>

            <p><strong>11. A tájékoztató módosítása</strong></p>

            <p>
                Jelen tájékoztatót a Játék fejlesztése vagy a jogszabályi környezet változása esetén
                frissíthetjük. A mindenkor hatályos szöveg ezen az oldalon, a Játékon belül érhető el. A
                tájékoztató jelen változatának hatálybalépése: 2026. augusztus 29.
            </p>
        `
    }
};

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }
}


function openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add("active");
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("active");
    }
}


function openConfirmModal(message, onConfirm) {
    const messageElement =
        document.getElementById("confirm-message");

    if (messageElement) {
        messageElement.textContent = message;
    }

    pendingConfirmAction = onConfirm;

    openModal("confirm-modal");
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
        gamesPlayed: Number(data.games_played) || 0,
        wins: Number(data.wins) || 0,
        losses: Number(data.losses) || 0,
        draws: Number(data.draws) || 0,
        rock: Number(data.rock) || 0,
        paper: Number(data.paper) || 0,
        scissors: Number(data.scissors) || 0
    };

    updateStatisticsUI();
}


async function checkLogin() {
    try {
        const response = await fetch("/api/me");
        const data = await response.json();

        if (!data.loggedIn) {
            currentUser = null;
            statistics = emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

        applyStatistics(data.statistics);
        updateProfileUI();

    } catch (error) {
        console.error(error);
    }
}

async function startGame() {
    if (gameStarting || roundInProgress) {
        return;
    }

    if (!currentUser) {
        openModal("profile-modal");
        return;
    }

    gameStarting = true;

    try {
        const response = await fetch("/api/game/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                currentUser = null;
                updateProfileUI();
                openModal("profile-modal");
            }

            return;
        }

        playerScore = Number(data.playerScore) || 0;
        computerScore = Number(data.computerScore) || 0;
        currentTargetScore = Number(data.targetScore) || 5;

        gameFinished = false;
        roundInProgress = false;

        document.getElementById("player-score").textContent =
            playerScore;

        document.getElementById("computer-score").textContent =
            computerScore;

        document.getElementById("player-choice").textContent = "?";
        document.getElementById("computer-choice").textContent = "?";

        document.getElementById("player-choice-name").textContent =
            translations[currentLanguage].waiting;

        document.getElementById("computer-choice-name").textContent =
            translations[currentLanguage].waiting;

        document.getElementById("result").textContent =
            translations[currentLanguage].chooseWeapon;

        updateTargetScoreInfo();
        setChoiceButtonsDisabled(false);

        showScreen("game-screen");

    } catch (error) {
        console.error(error);

    } finally {
        gameStarting = false;
    }
}


function updateTargetScoreInfo() {
    const targetInfo =
        document.getElementById("target-score-info");

    if (targetInfo) {
        targetInfo.textContent =
            `${translations[currentLanguage].targetScoreLabel} ${currentTargetScore}`;
    }
}


function setChoiceButtonsDisabled(disabled) {
    document.querySelectorAll(".choice-btn").forEach(btn => {
        btn.disabled = disabled;
        btn.classList.toggle("disabled", disabled);
    });
}


function setChoiceArea(choiceId, choice) {
    const element = document.getElementById(choiceId);

    if (!element) {
        return;
    }

    if (choice && choiceIcons[choice]) {
        element.innerHTML = choiceIcons[choice];
    } else {
        element.textContent = "?";
    }
}


async function playRound(playerChoice) {
    if (!currentUser || gameFinished || roundInProgress) {
        return;
    }

    roundInProgress = true;

    setChoiceButtonsDisabled(true);

    const playerChoiceElement =
        document.getElementById("player-choice");

    const computerChoiceElement =
        document.getElementById("computer-choice");

    const playerChoiceName =
        document.getElementById("player-choice-name");

    const computerChoiceName =
        document.getElementById("computer-choice-name");

    const resultElement =
        document.getElementById("result");

    playerChoiceElement.classList.remove("choice-reveal");
    computerChoiceElement.classList.remove("choice-reveal");

    playerChoiceElement.textContent = "?";
    computerChoiceElement.textContent = "?";

    playerChoiceName.textContent =
        translations[currentLanguage].waiting;

    computerChoiceName.textContent =
        translations[currentLanguage].computerChoosing;

    resultElement.textContent =
        translations[currentLanguage].computerChoosing;

    playSound("click");

    try {
        const responsePromise = fetch("/api/game/round", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerChoice
            })
        });

        const countdownValues = ["3", "2", "1"];

        for (const value of countdownValues) {
            resultElement.textContent = value;

            playSound("computer");

            await sleep(350);
        }

        resultElement.textContent =
            translations[currentLanguage].reveal;

        await sleep(300);

        const response = await responsePromise;
        const data = await response.json();

        if (!response.ok) {
            console.error(
                data.error || "A kör indítása sikertelen."
            );

            if (response.status === 401) {
                currentUser = null;
                updateProfileUI();
            }

            return;
        }

        setChoiceArea(
            "player-choice",
            data.playerChoice
        );

        playerChoiceName.textContent =
            data.playerChoice.toUpperCase();

        playerChoiceElement.classList.add("choice-reveal");

        await sleep(250);

        setChoiceArea(
            "computer-choice",
            data.computerChoice
        );

        computerChoiceName.textContent =
            data.computerChoice.toUpperCase();

        computerChoiceElement.classList.add("choice-reveal");

        await sleep(350);

        playerScore = Number(data.playerScore) || 0;
        computerScore = Number(data.computerScore) || 0;

        if (data.targetScore) {
            currentTargetScore =
                Number(data.targetScore) || currentTargetScore;

            updateTargetScoreInfo();
        }

        document.getElementById("player-score").textContent =
            playerScore;

        document.getElementById("computer-score").textContent =
            computerScore;

        let resultText;

        if (data.result === "draw") {
            resultText =
                translations[currentLanguage].roundDraw;

            playSound("draw");

        } else if (data.result === "win") {
            resultText =
                translations[currentLanguage].roundWin;

            playSound("win");

        } else {
            resultText =
                translations[currentLanguage].roundLoss;

            playSound("lose");
        }

        resultElement.textContent = resultText;

        applyStatistics(data.statistics);

        if (data.gameFinished) {
            gameFinished = true;

            await sleep(900);

            await finishGame(data.finalResult);

            return;
        }

        await sleep(650);

        resultElement.textContent =
            translations[currentLanguage].chooseWeapon;

        setChoiceButtonsDisabled(false);

    } catch (error) {
        console.error(error);

        setChoiceButtonsDisabled(false);

    } finally {
        roundInProgress = false;
    }
}


async function finishGame(finalResultFromRound = null) {
    if (!gameFinished) {
        gameFinished = true;
    }

    const finalResult =
        finalResultFromRound ||
        (playerScore > computerScore ? "win" : "loss");

    try {
        const response = await fetch("/api/game/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            applyStatistics(data.statistics);
        } else {
            console.error(
                data.error || "A játék lezárása sikertelen."
            );
        }

    } catch (error) {
        console.error(error);
    }

    if (finalResult === "win") {
        document.getElementById("end-title").textContent =
            currentLanguage === "hu"
                ? "NYERTÉL!"
                : "YOU WIN!";

        document.getElementById("end-message").textContent =
            currentLanguage === "hu"
                ? "Gratulálunk, te érted el előbb a célpontszámot!"
                : "Congratulations!";

        playSound("gameover-win");

    } else {
        document.getElementById("end-title").textContent =
            currentLanguage === "hu"
                ? "VESZTETTÉL!"
                : "YOU LOST!";

        document.getElementById("end-message").textContent =
            currentLanguage === "hu"
                ? "Az ellenfél érte el előbb a célpontszámot."
                : "Better luck next time!";

        playSound("lose");
    }

    document.getElementById("final-player-score").textContent =
        playerScore;

    document.getElementById("final-computer-score").textContent =
        computerScore;

    setChoiceButtonsDisabled(true);

    showScreen("end-screen");
}


function resetGame() {
    playerScore = 0;
    computerScore = 0;

    gameFinished = false;
    roundInProgress = false;

    document.getElementById("player-score").textContent = "0";
    document.getElementById("computer-score").textContent = "0";

    document.getElementById("player-choice").textContent = "?";
    document.getElementById("computer-choice").textContent = "?";

    document.getElementById("player-choice-name").textContent =
        translations[currentLanguage].waiting;

    document.getElementById("computer-choice-name").textContent =
        translations[currentLanguage].waiting;

    document.getElementById("result").textContent =
        translations[currentLanguage].chooseWeapon;

    setChoiceButtonsDisabled(false);
}


async function registerUser(
    username,
    password,
    privacyAccepted
) {
    const errorElement =
        document.getElementById("auth-error");

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";

    const genderElement =
        document.querySelector(
            'input[name="gender"]:checked'
        );

    const gender =
        genderElement ? genderElement.value : "";

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
            errorElement.textContent =
                data.error || "Hiba történt.";

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

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


async function loginUser(username, password) {
    const errorElement =
        document.getElementById("auth-error");

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
                    currentLanguage === "hu"
                        ? "Hibás felhasználónév vagy jelszó!"
                        : "Invalid username or password!"
                );

            return;
        }

        currentUser = data.user;

        if (data.user.theme) {
            setTheme(data.user.theme, false);
        }

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

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
        await fetch("/api/logout", {
            method: "POST"
        });
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
        const response = await fetch("/api/me");
        const data = await response.json();

        if (!data.loggedIn) {
            currentUser = null;
            statistics = emptyStatistics();

            updateProfileUI();
            updateStatisticsUI();

            return;
        }

        currentUser = data.user;

        setDifficulty(
            data.user.difficulty || 5,
            false
        );

        applyStatistics(data.statistics);

        updateProfileUI();

    } catch (error) {
        console.error(error);
    }
}


function updateProfileUI() {
    const authForms =
        document.getElementById("auth-forms");

    const loggedInView =
        document.getElementById("logged-in-view");

    const currentUsernameElem =
        document.getElementById("current-username");

    const joinDateElem =
        document.getElementById("user-join-date");

    if (
        !authForms ||
        !loggedInView ||
        !currentUsernameElem ||
        !joinDateElem
    ) {
        return;
    }

    if (currentUser) {
        authForms.style.display = "none";
        loggedInView.style.display = "block";

        currentUsernameElem.textContent =
            currentUser.username;

        joinDateElem.textContent =
            currentUser.joined || "-";

        updateStatisticsUI();

    } else {
        authForms.style.display = "block";
        loggedInView.style.display = "none";
    }
}


async function setTheme(
    themeKey,
    saveToServer = true
) {
    currentTheme = themeKey;

    document.body.setAttribute(
        "data-theme",
        themeKey
    );

    localStorage.setItem(
        "gameTheme",
        themeKey
    );

    if (!saveToServer || !currentUser) {
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
            currentUser.theme = themeKey;
        }

    } catch (error) {
        console.error(error);
    }
}


function updateDifficultyUI() {
    document
        .querySelectorAll(".setting-difficulty-btn")
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                Number(btn.dataset.difficulty) ===
                currentDifficulty
            );
        });
}


async function setDifficulty(
    value,
    saveToServer = true
) {
    const parsedValue = Number(value);

    if (![3, 5, 10].includes(parsedValue)) {
        return;
    }

    currentDifficulty = parsedValue;

    updateDifficultyUI();

    if (!saveToServer || !currentUser) {
        return;
    }

    try {
        const response = await fetch(
            "/api/difficulty",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    difficulty: parsedValue
                })
            }
        );

        if (!response.ok) {
            console.error(
                "A nehézségi szint mentése sikertelen."
            );

            return;
        }

        currentUser.difficulty = parsedValue;

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
        .querySelectorAll("[data-i18n]")
        .forEach(elem => {
            const key = elem.dataset.i18n;

            if (
                translations[lang] &&
                translations[lang][key]
            ) {
                elem.textContent =
                    translations[lang][key];
            }
        });

    document
        .querySelectorAll("[data-i18n-html]")
        .forEach(elem => {
            const key = elem.dataset.i18nHtml;

            if (
                translations[lang] &&
                translations[lang][key]
            ) {
                elem.innerHTML =
                    translations[lang][key];
            }
        });

    document
        .querySelectorAll(".setting-lang-btn")
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.settingLang === lang
            );
        });

    const soundToggleText =
        document.getElementById(
            "sound-toggle-text"
        );

    if (soundToggleText) {
        soundToggleText.textContent =
            soundEnabled
                ? translations[currentLanguage].on
                : translations[currentLanguage].off;
    }

    const playerChoiceName =
        document.getElementById(
            "player-choice-name"
        );

    if (playerChoiceName) {
        playerChoiceName.textContent =
            translations[currentLanguage].waiting;
    }

    const computerChoiceName =
        document.getElementById(
            "computer-choice-name"
        );

    if (computerChoiceName) {
        computerChoiceName.textContent =
            translations[currentLanguage].waiting;
    }

    const creatorModalBtnElem =
        document.getElementById(
            "creator-modal-btn"
        );

    if (creatorModalBtnElem) {
        creatorModalBtnElem.title =
            translations[currentLanguage].moreAboutCreator;

        creatorModalBtnElem.setAttribute(
            "aria-label",
            translations[currentLanguage].moreAboutCreator
        );
    }

    updateTargetScoreInfo();
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
                (statistics.wins /
                    statistics.gamesPlayed) *
                100
            )
            : 0;

    if (winRateElement) {
        winRateElement.textContent =
            `${winRate}%`;
    }
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

const rpsGameBtn =
    document.getElementById("rps-game-btn");

if (rpsGameBtn) {
    rpsGameBtn.addEventListener(
        "click",
        startGame
    );
}


const profileBtn =
    document.getElementById("profile-btn");

if (profileBtn) {
    profileBtn.addEventListener(
        "click",
        () => {
            updateProfileUI();
            openModal("profile-modal");
        }
    );
}


const settingsBtn =
    document.getElementById("settings-btn");

if (settingsBtn) {
    settingsBtn.addEventListener(
        "click",
        () => openModal("settings-modal")
    );
}


const menuGameBtn =
    document.getElementById("menu-game-btn");

if (menuGameBtn) {
    menuGameBtn.addEventListener(
        "click",
        () => showScreen("menu-screen")
    );
}


const menuBtn =
    document.getElementById("menu-btn");

if (menuBtn) {
    menuBtn.addEventListener(
        "click",
        () => showScreen("menu-screen")
    );
}


const resetBtn =
    document.getElementById("reset-btn");

if (resetBtn) {
    resetBtn.addEventListener(
        "click",
        startGame
    );
}


const playAgainBtn =
    document.getElementById("play-again-btn");

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
                    closeModal(modalId);
                }
            }
        );
    });




document
    .querySelectorAll(".theme-preset-btn")
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
    .querySelectorAll(".setting-difficulty-btn")
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                setDifficulty(
                    btn.dataset.difficulty
                );
            }
        );
    });



document
    .querySelectorAll(".setting-lang-btn")
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
    document.getElementById("sound-toggle");

if (soundToggle) {
    soundToggle.addEventListener(
        "click",
        () => {
            if (!soundEnabled) {
                soundEnabled = true;
                playSound("click");
            } else {
                soundEnabled = false;
            }

            const soundToggleText =
                document.getElementById(
                    "sound-toggle-text"
                );

            if (soundToggleText) {
                soundToggleText.textContent =
                    soundEnabled
                        ? translations[currentLanguage].on
                        : translations[currentLanguage].off;
            }
        }
    );
}


const registerBtn =
    document.getElementById("register-btn");

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

            const privacyCheckbox =
                document.getElementById(
                    "privacy-checkbox"
                );

            const errorElement =
                document.getElementById(
                    "auth-error"
                );

            if (
                !privacyCheckbox ||
                !privacyCheckbox.checked
            ) {
                errorElement.textContent =
                    translations[
                        currentLanguage
                    ].privacyRequiredError;

                return;
            }

            registerUser(
                username,
                password,
                true
            );
        }
    );
}


const loginBtn =
    document.getElementById("login-btn");

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
    logoutBtn.addEventListener(
        "click",
        () => {
            openConfirmModal(
                translations[
                    currentLanguage
                ].confirmLogout,
                logoutUser
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
            if (!currentUser) {
                return;
            }

            openConfirmModal(
                translations[
                    currentLanguage
                ].confirmResetStats,

                async () => {
                    try {
                        const response =
                            await fetch(
                                "/api/statistics",
                                {
                                    method: "DELETE"
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            console.error(
                                data.error
                            );

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
    );
}


const confirmYesBtn =
    document.getElementById(
        "confirm-yes-btn"
    );

if (confirmYesBtn) {
    confirmYesBtn.addEventListener(
        "click",
        () => {
            const action =
                pendingConfirmAction;

            pendingConfirmAction = null;

            closeModal("confirm-modal");

            if (action) {
                action();
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


const savedTheme =
    localStorage.getItem("gameTheme") ||
    "pink-brown";

const savedLanguage =
    localStorage.getItem("gameLanguage") ||
    "hu";

setTheme(savedTheme, false);

setDifficulty(
    currentDifficulty,
    false
);

setLanguage(savedLanguage);

checkLogin();