import { appState } from "../../core/state.js";
import { showScreen, openModal } from "../../core/ui.js";
import { translations } from "../../core/i18n.js";
import {
    apiFetch,
    applyStatistics,
    updateProfileUI
} from "../../core/api.js";


let game2048Board = [];
let game2048Score = 0;
let game2048Best = Number(
    localStorage.getItem("lizugames2048Best")
) || 0;

let game2048Won = false;
let game2048GameOver = false;

let game2048TouchStartX = 0;
let game2048TouchStartY = 0;

let game2048Active = false;
let game2048History = [];
let game2048UndosRemaining = 0;

let game2048Tiles = [];
let game2048TileIdCounter = 0;
let game2048TileElements = new Map();
let game2048MoveInProgress = false;

let game2048MergedCells = new Set();
let game2048NewCell = null;

const GAME_2048_SLIDE_MS = 130;


function get2048TileLeft(col) {
    return `calc(${col} * 25% + ${col} * var(--cell-gap) / 4)`;
}

function get2048TileTop(row) {
    return `calc(${row} * 25% + ${row} * var(--cell-gap) / 4)`;
}


function ensure2048GridArea() {
    let gridArea =
        game2048BoardElement.querySelector(".game-2048-grid-area");

    if (gridArea) {
        return gridArea;
    }

    gridArea = document.createElement("div");
    gridArea.className = "game-2048-grid-area";

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cellBg = document.createElement("div");
            cellBg.className = "game-2048-cell-bg";
            cellBg.style.left = get2048TileLeft(col);
            cellBg.style.top = get2048TileTop(row);
            gridArea.appendChild(cellBg);
        }
    }

    game2048BoardElement.appendChild(gridArea);

    return gridArea;
}


const game2048BoardElement =
    document.getElementById("2048-board");

const game2048ScoreElement =
    document.getElementById("2048-score");

const game2048BestElement =
    document.getElementById("2048-best");

const game2048MessageElement =
    document.getElementById("2048-message");

const game2048Overlay =
    document.getElementById("2048-overlay");

const game2048OverlayTitle =
    document.getElementById("2048-overlay-title");

const game2048OverlayText =
    document.getElementById("2048-overlay-text");

const game2048UndoButton =
    document.getElementById("2048-undo-btn");


function create2048EmptyBoard() {

    return Array.from(
        { length: 4 },
        () => Array(4).fill(0)
    );

}


async function finish2048Match() {

    if (!game2048Active || !appState.currentUser) {
        game2048Active = false;
        return;
    }

    try {
        const response = await apiFetch(
            "/api/game2048/finish",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    score: game2048Score
                })
            }
        );

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error(
                "A /api/game2048/finish válasza nem érvényes JSON:",
                parseError
            );
        }

        if (!response.ok) {
            console.error(
                `A 2048 meccs lezárása sikertelen (státusz: ${response.status}):`,
                data && data.error
            );
        } else if (data && data.statistics) {
            applyStatistics(data.statistics);
        }

    } catch (error) {
        console.error(
            "Hálózati hiba a 2048 meccs lezárásakor:",
            error
        );

    } finally {
        game2048Active = false;
    }

}


function update2048UndoUI() {

    if (!game2048UndoButton) {
        return;
    }

    const label =
        translations[appState.currentLanguage].undo2048;

    game2048UndoButton.textContent =
        `${label} (${game2048UndosRemaining})`;

    game2048UndoButton.disabled =
        game2048UndosRemaining <= 0 ||
        !game2048History.length;

}


async function start2048Game() {

    if (!appState.currentUser) {
        openModal("profile-modal");
        return;
    }

    if (game2048Active) {
        await finish2048Match();
    }

    try {
        const response = await apiFetch(
            "/api/game2048/start",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error(
                "A /api/game2048/start válasza nem érvényes JSON:",
                parseError
            );
        }

        if (!response.ok) {
            console.error(
                `A 2048 jatek inditasa sikertelen (statusz: ${response.status}):`,
                data && data.error
            );

            if (response.status === 401) {
                appState.currentUser = null;
                updateProfileUI();
                openModal("profile-modal");
            } else {
                set2048Message(
                    translations[appState.currentLanguage].game2048ServerError
                );
            }

            return;
        }

        if (!data) {
            set2048Message(
                translations[appState.currentLanguage].game2048ServerError
            );
            return;
        }

        game2048UndosRemaining =
            Number(data.undosRemaining) || 0;

        game2048Active = true;

    } catch (error) {
        console.error(
            "Hálózati hiba a 2048 játék indításakor:",
            error
        );
        set2048Message(
            translations[appState.currentLanguage].game2048NetworkError
        );
        return;
    }

    game2048Board = create2048EmptyBoard();

    game2048Score = 0;
    game2048Won = false;
    game2048GameOver = false;

    game2048History = [];
    game2048Tiles = [];
    game2048MoveInProgress = false;

    hide2048Overlay();

    add2048RandomTile();
    add2048RandomTile();

    update2048Score();
    render2048Board();
    update2048UndoUI();

    set2048Message(
        translations[appState.currentLanguage].game2048Ready
    );

}



function add2048RandomTile() {

    const emptyCells = [];

    for (let row = 0; row < 4; row++) {

        for (let col = 0; col < 4; col++) {

            if (game2048Board[row][col] === 0) {

                emptyCells.push({
                    row,
                    col
                });

            }

        }

    }


    if (emptyCells.length === 0) {
        return;
    }


    const randomCell =
        emptyCells[
        Math.floor(
            Math.random() * emptyCells.length
        )
        ];


    const value =
        Math.random() < 0.9 ? 2 : 4;

    game2048Board[randomCell.row][randomCell.col] = value;

    game2048TileIdCounter++;

    game2048Tiles.push({
        id: game2048TileIdCounter,
        row: randomCell.row,
        col: randomCell.col,
        value,
        isNew: true,
        justMerged: false
    });

}

function render2048Board() {

    if (!game2048BoardElement) {
        return;
    }

    const gridArea = ensure2048GridArea();

    const currentIds =
        new Set(game2048Tiles.map(tile => tile.id));

    game2048TileElements.forEach((element, id) => {
        if (!currentIds.has(id)) {
            element.remove();
            game2048TileElements.delete(id);
        }
    });

    game2048Tiles.forEach(tile => {

        let element =
            game2048TileElements.get(tile.id);

        if (!element) {

            element = document.createElement("div");
            element.className = "game-2048-tile";

            gridArea.appendChild(element);
            game2048TileElements.set(tile.id, element);

            if (tile.isNew) {
                element.classList.add("tile-new");

                setTimeout(() => {
                    element.classList.remove("tile-new");
                }, 200);
            }

        }

        element.textContent = tile.value;
        element.dataset.value = tile.value;

        element.style.left = get2048TileLeft(tile.col);
        element.style.top = get2048TileTop(tile.row);

        if (tile.justMerged) {

            element.classList.remove("tile-merged");
            void element.offsetWidth;
            element.classList.add("tile-merged");

            setTimeout(() => {
                element.classList.remove("tile-merged");
            }, 220);

            tile.justMerged = false;

        }

    });

}


function update2048Score() {

    if (game2048ScoreElement) {
        game2048ScoreElement.textContent =
            game2048Score;
    }


    if (game2048Score > game2048Best) {

        game2048Best = game2048Score;

        localStorage.setItem(
            "lizugames2048Best",
            game2048Best
        );

    }


    if (game2048BestElement) {

        game2048BestElement.textContent =
            game2048Best;

    }

}


function set2048Message(message) {

    if (game2048MessageElement) {
        game2048MessageElement.textContent =
            message;
    }

}


function process2048Line(lineTiles) {

    const movements = [];
    const removedIds = [];

    let index = 0;
    let slot = 0;

    while (index < lineTiles.length) {

        const current = lineTiles[index];
        const next = lineTiles[index + 1];

        if (next && current.value === next.value) {

            current.value *= 2;
            current.justMerged = true;

            game2048Score += current.value;

            movements.push({ tile: current, slot });
            movements.push({ tile: next, slot });

            removedIds.push(next.id);

            index += 2;

        } else {

            movements.push({ tile: current, slot });

            index += 1;

        }

        slot++;

    }

    return { movements, removedIds };

}


function move2048Left(tiles) {

    const allRemovedIds = [];

    for (let row = 0; row < 4; row++) {

        const lineTiles = tiles
            .filter(tile => tile.row === row)
            .sort((a, b) => a.col - b.col);

        const { movements, removedIds } =
            process2048Line(lineTiles);

        movements.forEach(({ tile, slot }) => {
            tile.col = slot;
        });

        allRemovedIds.push(...removedIds);

    }

    return allRemovedIds;

}


function move2048Right(tiles) {

    const allRemovedIds = [];

    for (let row = 0; row < 4; row++) {

        const lineTiles = tiles
            .filter(tile => tile.row === row)
            .sort((a, b) => b.col - a.col);

        const { movements, removedIds } =
            process2048Line(lineTiles);

        movements.forEach(({ tile, slot }) => {
            tile.col = 3 - slot;
        });

        allRemovedIds.push(...removedIds);

    }

    return allRemovedIds;

}


function move2048Up(tiles) {

    const allRemovedIds = [];

    for (let col = 0; col < 4; col++) {

        const lineTiles = tiles
            .filter(tile => tile.col === col)
            .sort((a, b) => a.row - b.row);

        const { movements, removedIds } =
            process2048Line(lineTiles);

        movements.forEach(({ tile, slot }) => {
            tile.row = slot;
        });

        allRemovedIds.push(...removedIds);

    }

    return allRemovedIds;

}


function move2048Down(tiles) {

    const allRemovedIds = [];

    for (let col = 0; col < 4; col++) {

        const lineTiles = tiles
            .filter(tile => tile.col === col)
            .sort((a, b) => b.row - a.row);

        const { movements, removedIds } =
            process2048Line(lineTiles);

        movements.forEach(({ tile, slot }) => {
            tile.row = 3 - slot;
        });

        allRemovedIds.push(...removedIds);

    }

    return allRemovedIds;

}


function move2048(direction) {

    if (
        game2048GameOver ||
        !game2048Board.length ||
        game2048MoveInProgress
    ) {
        return;
    }

    const previousBoard =
        JSON.stringify(game2048Board);

    const previousScore = game2048Score;
    const previousWon = game2048Won;

    const previousTilesSnapshot =
        game2048Tiles.map(tile => ({ ...tile }));

    const workingTiles =
        game2048Tiles.map(tile => ({
            ...tile,
            isNew: false,
            justMerged: false
        }));

    let removedIds = [];

    if (direction === "left") {
        removedIds = move2048Left(workingTiles);
    }

    if (direction === "right") {
        removedIds = move2048Right(workingTiles);
    }

    if (direction === "up") {
        removedIds = move2048Up(workingTiles);
    }

    if (direction === "down") {
        removedIds = move2048Down(workingTiles);
    }

    const newBoard = create2048EmptyBoard();

    workingTiles
        .filter(tile => !removedIds.includes(tile.id))
        .forEach(tile => {
            newBoard[tile.row][tile.col] = tile.value;
        });

    const newBoardString = JSON.stringify(newBoard);

    if (previousBoard === newBoardString) {

        game2048Score = previousScore;

        if (!can2048Move()) {
            end2048Game(false);
        }

        return;

    }

    game2048MoveInProgress = true;

    game2048History.push({
        board: JSON.parse(previousBoard),
        tiles: previousTilesSnapshot,
        score: previousScore,
        won: previousWon
    });

    if (game2048History.length > 50) {
        game2048History.shift();
    }

    game2048Tiles = workingTiles;
    game2048Board = newBoard;

    render2048Board();

    setTimeout(() => {

        game2048Tiles = game2048Tiles.filter(
            tile => !removedIds.includes(tile.id)
        );

        add2048RandomTile();

        update2048Score();
        render2048Board();
        update2048UndoUI();

        game2048MoveInProgress = false;

        if (!game2048Won && has2048Won()) {

            game2048Won = true;

            show2048Overlay(
                translations[appState.currentLanguage].game2048Won,
                translations[appState.currentLanguage].game2048WonText
            );

            return;

        }

        if (!can2048Move()) {
            end2048Game(false);
        }

    }, GAME_2048_SLIDE_MS);

}


function has2048Won() {

    for (let row = 0; row < 4; row++) {

        for (let col = 0; col < 4; col++) {

            if (
                game2048Board[row][col] >= 2048
            ) {

                return true;

            }

        }

    }


    return false;

}


function can2048Move() {

    for (let row = 0; row < 4; row++) {

        for (let col = 0; col < 4; col++) {

            if (
                game2048Board[row][col] === 0
            ) {

                return true;

            }


            if (
                col < 3 &&
                game2048Board[row][col] ===
                game2048Board[row][col + 1]
            ) {

                return true;

            }


            if (
                row < 3 &&
                game2048Board[row][col] ===
                game2048Board[row + 1][col]
            ) {

                return true;

            }

        }

    }


    return false;

}


async function undo2048() {

    if (
        !appState.currentUser ||
        !game2048Active ||
        game2048UndosRemaining <= 0 ||
        !game2048History.length
    ) {
        return;
    }

    try {
        const response = await apiFetch(
            "/api/game2048/undo",
            {
                method: "POST"
            }
        );

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error(
                "A /api/game2048/undo válasza nem érvényes JSON:",
                parseError
            );
        }

        if (!response.ok) {
            console.error(
                `A visszavonás sikertelen (státusz: ${response.status}):`,
                data && data.error
            );

            if (response.status === 401) {
                appState.currentUser = null;
                updateProfileUI();
                openModal("profile-modal");
            } else {
                set2048Message(
                    translations[appState.currentLanguage].game2048ServerError
                );
            }

            return;
        }

        if (!data) {
            set2048Message(
                translations[appState.currentLanguage].game2048ServerError
            );
            return;
        }

        const previous =
            game2048History.pop();

        game2048Board = previous.board;

        game2048Tiles = previous.tiles.map(tile => ({
            ...tile,
            isNew: false,
            justMerged: false
        }));

        game2048Score = previous.score;
        game2048Won = previous.won;
        game2048GameOver = false;

        game2048UndosRemaining =
            Number(data.undosRemaining) || 0;


        hide2048Overlay();
        update2048Score();
        render2048Board();
        update2048UndoUI();

        set2048Message(
            translations[appState.currentLanguage].game2048Ready
        );

        if (data.statistics) {
            applyStatistics(data.statistics);
        }

    } catch (error) {
        console.error(error);
    }

}


if (game2048UndoButton) {

    game2048UndoButton.addEventListener(
        "click",
        undo2048
    );

}


function end2048Game(won) {

    game2048GameOver = true;


    if (won) {

        show2048Overlay(
            translations[appState.currentLanguage].game2048Won,
            translations[appState.currentLanguage].game2048WonText
        );

    } else {

        finish2048Match();

        show2048Overlay(
            translations[appState.currentLanguage].game2048Over,
            translations[appState.currentLanguage].game2048OverText
        );

    }

}


function show2048Overlay(title, text) {

    if (game2048OverlayTitle) {
        game2048OverlayTitle.textContent =
            title;
    }


    if (game2048OverlayText) {
        game2048OverlayText.textContent =
            text;
    }


    if (game2048Overlay) {
        game2048Overlay.classList.add("active");
    }

}


function hide2048Overlay() {

    if (game2048Overlay) {
        game2048Overlay.classList.remove(
            "active"
        );
    }

}


document.addEventListener(
    "keydown",
    event => {

        if (
            !document
                .getElementById("game-2048-screen")
                ?.classList.contains("active")
        ) {
            return;
        }


        const keyMap = {

            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down"

        };


        const direction =
            keyMap[event.key];


        if (!direction) {
            return;
        }


        event.preventDefault();

        move2048(direction);

    }
);



if (game2048BoardElement) {

    game2048BoardElement.addEventListener(
        "touchstart",
        event => {

            const touch =
                event.changedTouches[0];

            game2048TouchStartX =
                touch.clientX;

            game2048TouchStartY =
                touch.clientY;

        },
        { passive: true }
    );


    game2048BoardElement.addEventListener(
        "touchmove",
        event => {
            event.preventDefault();
        },
        { passive: false }
    );


    game2048BoardElement.addEventListener(
        "touchend",
        event => {

            const touch =
                event.changedTouches[0];

            const deltaX =
                touch.clientX -
                game2048TouchStartX;

            const deltaY =
                touch.clientY -
                game2048TouchStartY;


            const minSwipeDistance = 30;


            if (
                Math.abs(deltaX) <
                minSwipeDistance &&
                Math.abs(deltaY) <
                minSwipeDistance
            ) {
                return;
            }


            if (
                Math.abs(deltaX) >
                Math.abs(deltaY)
            ) {

                move2048(
                    deltaX > 0
                        ? "right"
                        : "left"
                );

            } else {

                move2048(
                    deltaY > 0
                        ? "down"
                        : "up"
                );

            }

        },
        { passive: true }
    );

}


const game2048Button =
    document.getElementById("2048-game-btn");

if (game2048Button) {

    game2048Button.addEventListener(
        "click",
        () => {

            if (!appState.currentUser) {
                openModal("profile-modal");
                return;
            }

            showScreen(
                "game-2048-screen"
            );

            start2048Game();

        }
    );

}


const game2048MenuButton =
    document.getElementById("2048-menu-btn");

if (game2048MenuButton) {

    game2048MenuButton.addEventListener(
        "click",
        () => {

            finish2048Match();
            hide2048Overlay();

            showScreen(
                "menu-screen"
            );

        }
    );

}


const game2048NewGameButton =
    document.getElementById(
        "2048-new-game-btn"
    );

if (game2048NewGameButton) {

    game2048NewGameButton.addEventListener(
        "click",
        start2048Game
    );

}


const game2048OverlayNewGame =
    document.getElementById(
        "2048-overlay-new-game"
    );

if (game2048OverlayNewGame) {

    game2048OverlayNewGame.addEventListener(
        "click",
        start2048Game
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

            finish2048Match();
            hide2048Overlay();

            showScreen(
                "menu-screen"
            );

        }
    );

}


update2048Score();
update2048UndoUI();


export function init2048Game() {}
