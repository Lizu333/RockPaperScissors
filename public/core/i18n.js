import { appState } from "./state.js";


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
        siteTitle: "LizuGames",
        selectGame: "Choose a game",
        rpsTitle: "Rock - Paper - Scissors",
        rpsDescription: "Reach the target score first!",
        game2048Title: "2048",
        game2048Description: "Combine the tiles and reach 2048!",
        tictactoeTitle: "Tic-Tac-Toe",
        tictactoeDescription: "The classic three-in-a-row game.",
        sudokuTitle: "Sudoku",
        sudokuDescription: "The classic Sudoku puzzle.",
        comingSoon: "COMING SOON",
        score2048: "SCORE",
        best2048: "BEST",
        game2048Instructions: "Combine matching tiles and reach 2048!",
        new2048Game: "NEW GAME",
        game2048Ready: "Use the arrow keys or move the tiles!",
        game2048Won: "You reached 2048!",
        game2048WonText: "Congratulations! You can continue playing or start a new game.",
        game2048Over: "GAME OVER",
        game2048OverText: "No more moves are possible.",
        game2048ServerError: "A server error occurred. Please try again!",
        game2048NetworkError: "Could not connect to the server. Check your connection and try again!",
        undo2048: "UNDO",
        matches2048: "MATCHES PLAYED",
        bestScore2048Stat: "BEST SCORE",
        undosUsed2048: "UNDOS USED",
        confirmResetStats2048:
            "Are you sure you want to delete your 2048 appState.statistics history?",
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
            "Are you sure you want to delete your appState.statistics history?",
        targetScoreLabel: "Target:",
        logout: "LOGOUT",
        computerChoosing: "Computer is choosing...",
        reveal: "REVEAL!",
        roundWin: "You won this round!",
        roundLoss: "You lost this round!",
        roundDraw: "It's a draw this round!",
        moreAboutCreator: "About the creator",
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
                c) Settings and game data (selected theme, difficulty level, game appState.statistics - wins, losses,
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
                you log out. Other data related to your account and appState.statistics is stored until your account
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
        tictactoeTitle: "Tic-Tac-Toe",
        tictactoeDescription: "3 a sorban.",
        sudokuTitle: "Sudoku",
        sudokuDescription: "A klasszikus Sudoku játék.",
        siteTitle: "LizuGames",
        selectGame: "Válassz egy játékot!",
        rpsTitle: "Kő - Papír - Olló",
        rpsDescription: "Érd el elsőként a célpontszámot!",
        game2048Title: "2048",
        game2048Description: "Érd el a 2048-at!",
        comingSoon: "HAMAROSAN",
        score2048: "PONTSZÁM",
        best2048: "REKORD",
        game2048Instructions: "Kombináld az azonos számokat, és érd el a 2048-at!",
        new2048Game: "ÚJ JÁTÉK",
        game2048Ready: "Használd a nyilakat vagy mozgasd a kártyákat!",
        game2048Won: "Elérted a 2048-at!",
        game2048WonText: "Gratulálok! Folytathatod a játékot, vagy indíthatsz egy újat.",
        game2048Over: "JÁTÉK VÉGE",
        game2048OverText: "Nincs több lehetséges lépés.",
        game2048ServerError: "Hiba történt a szerverrel való kommunikáció során. Próbáld újra!",
        game2048NetworkError: "Nem sikerült kapcsolódni a szerverhez. Ellenőrizd a kapcsolatot, és próbáld újra!",
        comingSoon: "HAMAROSAN",
        undo2048: "VISSZAVONÁS",
        matches2048: "JÁTSZOTT MECCSEK",
        bestScore2048Stat: "LEGJOBB PONTSZÁM",
        undosUsed2048: "HASZNÁLT VISSZAVONÁSOK",
        confirmResetStats2048:
            "Biztos törlöd a 2048 statisztikai előzményeidet?",
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
        moreAboutCreator: "A készítőről",
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



function setLanguage(lang) {
    if (!translations[lang]) {
        return;
    }

    appState.currentLanguage = lang;

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
            appState.soundEnabled
                ? translations[appState.currentLanguage].on
                : translations[appState.currentLanguage].off;
    }

    const playerChoiceName =
        document.getElementById(
            "player-choice-name"
        );

    if (playerChoiceName) {
        playerChoiceName.textContent =
            translations[appState.currentLanguage].waiting;
    }

    const computerChoiceName =
        document.getElementById(
            "computer-choice-name"
        );

    if (computerChoiceName) {
        computerChoiceName.textContent =
            translations[appState.currentLanguage].waiting;
    }

    const creatorModalBtnElem =
        document.getElementById(
            "creator-modal-btn"
        );

    if (creatorModalBtnElem) {
        creatorModalBtnElem.title =
            translations[appState.currentLanguage].moreAboutCreator;

        creatorModalBtnElem.setAttribute(
            "aria-label",
            translations[appState.currentLanguage].moreAboutCreator
        );
    }

    window.dispatchEvent(new Event("lizugames:languagechange"));
}



export { translations, setLanguage };