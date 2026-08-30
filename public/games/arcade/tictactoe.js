import { appState } from "../../core/state.js";
import { showScreen } from "../../core/ui.js";
import { translations } from "../../core/i18n.js";
import { playSound } from "../../core/audio.js";

let boardSize = 3;
let board = [];
let gameActive = false;
let computerThinking = false;
let initialized = false;

const WIN_LENGTH = {
    3: 3,
    5: 4
};

function t(key) {
    const language = appState.currentLanguage || "hu";
    return translations[language]?.[key] ?? key;
}

function getElement(id) {
    return document.getElementById(id);
}

function updateMessage(key) {
    const message = getElement("tictactoe-message");

    if (message) {
        message.textContent = t(key);
    }
}

function updateBoardSizeButtons() {
    const button3x3 = getElement("tictactoe-3x3-btn");
    const button5x5 = getElement("tictactoe-5x5-btn");

    if (button3x3) {
        button3x3.classList.toggle("active", boardSize === 3);
    }

    if (button5x5) {
        button5x5.classList.toggle("active", boardSize === 5);
    }
}

function createBoard() {
    board = Array(boardSize * boardSize).fill(null);
    gameActive = true;
    computerThinking = false;

    renderBoard();
    updateMessage("tictactoeYourTurn");
}

function renderBoard() {
    const boardElement = getElement("tictactoe-board");

    if (!boardElement) {
        return;
    }

    boardElement.innerHTML = "";

    boardElement.style.gridTemplateColumns =
        `repeat(${boardSize}, 1fr)`;

    boardElement.style.gridTemplateRows =
        `repeat(${boardSize}, 1fr)`;

    for (let index = 0; index < board.length; index++) {
        const cell = document.createElement("button");

        cell.type = "button";
        cell.className = "tictactoe-cell";
        cell.dataset.index = index;

        const value = board[index];

        if (value) {
            cell.textContent = value;

            if (value === "X") {
                cell.classList.add("player");
            } else {
                cell.classList.add("computer");
            }
        }

        cell.disabled =
            !gameActive ||
            computerThinking ||
            value !== null;

        cell.addEventListener("click", () => {
            playerMove(index);
        });

        boardElement.appendChild(cell);
    }
}

function playerMove(index) {
    if (
        !gameActive ||
        computerThinking ||
        board[index] !== null
    ) {
        return;
    }

    board[index] = "X";

    playSound("click");

    renderBoard();

    const result = checkGameResult();

    if (result) {
        finishGame(result);
        return;
    }

    computerThinking = true;

    updateMessage("tictactoeComputerTurn");
    renderBoard();

    window.setTimeout(() => {
        computerMove();
    }, boardSize === 3 ? 300 : 450);
}

function computerMove() {
    if (!gameActive) {
        return;
    }

    const move = getComputerMove();

    if (move === -1) {
        finishGame("draw");
        return;
    }

    board[move] = "O";

    playSound("click");

    computerThinking = false;

    renderBoard();

    const result = checkGameResult();

    if (result) {
        finishGame(result);
        return;
    }

    updateMessage("tictactoeYourTurn");
}

function getComputerMove() {
    const emptyCells = getEmptyCells();

    if (emptyCells.length === 0) {
        return -1;
    }

    const winningMove = findWinningMove("O");

    if (winningMove !== -1) {
        return winningMove;
    }

    const blockingMove = findWinningMove("X");

    if (blockingMove !== -1) {
        return blockingMove;
    }

    const strategicMove = findStrategicMove();

    if (strategicMove !== -1) {
        return strategicMove;
    }

    return emptyCells[
        Math.floor(Math.random() * emptyCells.length)
    ];
}

function findWinningMove(player) {
    const emptyCells = getEmptyCells();

    for (const index of emptyCells) {
        board[index] = player;

        const winner = checkWinner();

        board[index] = null;

        if (winner === player) {
            return index;
        }
    }

    return -1;
}

function findStrategicMove() {
    const centerRow = Math.floor(boardSize / 2);
    const centerCol = Math.floor(boardSize / 2);
    const centerIndex =
        centerRow * boardSize + centerCol;

    if (board[centerIndex] === null) {
        return centerIndex;
    }

    const corners = [
        0,
        boardSize - 1,
        boardSize * (boardSize - 1),
        boardSize * boardSize - 1
    ];

    const availableCorners =
        corners.filter(index => board[index] === null);

    if (availableCorners.length > 0) {
        return availableCorners[
            Math.floor(
                Math.random() * availableCorners.length
            )
        ];
    }

    const emptyCells = getEmptyCells();

    if (emptyCells.length === 0) {
        return -1;
    }

    return emptyCells[
        Math.floor(Math.random() * emptyCells.length)
    ];
}

function getEmptyCells() {
    const emptyCells = [];

    for (let index = 0; index < board.length; index++) {
        if (board[index] === null) {
            emptyCells.push(index);
        }
    }

    return emptyCells;
}

function checkWinner() {
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    const requiredLength = WIN_LENGTH[boardSize];

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const startIndex =
                row * boardSize + col;

            const player = board[startIndex];

            if (!player) {
                continue;
            }

            for (const [rowDirection, colDirection] of directions) {
                let count = 1;

                for (
                    let step = 1;
                    step < requiredLength;
                    step++
                ) {
                    const nextRow =
                        row + rowDirection * step;

                    const nextCol =
                        col + colDirection * step;

                    if (
                        nextRow < 0 ||
                        nextRow >= boardSize ||
                        nextCol < 0 ||
                        nextCol >= boardSize
                    ) {
                        break;
                    }

                    const nextIndex =
                        nextRow * boardSize + nextCol;

                    if (board[nextIndex] !== player) {
                        break;
                    }

                    count++;
                }

                if (count === requiredLength) {
                    return player;
                }
            }
        }
    }

    return null;
}

function getWinningCells(player) {
    if (!player) {
        return [];
    }

    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    const requiredLength = WIN_LENGTH[boardSize];

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const startIndex =
                row * boardSize + col;

            if (board[startIndex] !== player) {
                continue;
            }

            for (const [rowDirection, colDirection] of directions) {
                const cells = [startIndex];

                for (
                    let step = 1;
                    step < requiredLength;
                    step++
                ) {
                    const nextRow =
                        row + rowDirection * step;

                    const nextCol =
                        col + colDirection * step;

                    if (
                        nextRow < 0 ||
                        nextRow >= boardSize ||
                        nextCol < 0 ||
                        nextCol >= boardSize
                    ) {
                        break;
                    }

                    const nextIndex =
                        nextRow * boardSize + nextCol;

                    if (board[nextIndex] !== player) {
                        break;
                    }

                    cells.push(nextIndex);
                }

                if (cells.length === requiredLength) {
                    return cells;
                }
            }
        }
    }

    return [];
}

function highlightWinningCells(player) {
    const winningCells =
        getWinningCells(player);

    for (const index of winningCells) {
        const cell = document.querySelector(
            `#tictactoe-board [data-index="${index}"]`
        );

        if (cell) {
            cell.classList.add("winning");
        }
    }
}

function checkGameResult() {
    const winner = checkWinner();

    if (winner) {
        return winner;
    }

    if (getEmptyCells().length === 0) {
        return "draw";
    }

    return null;
}

function finishGame(result) {
    gameActive = false;
    computerThinking = false;

    renderBoard();

    if (result === "X") {
        highlightWinningCells("X");
        showEndScreen("win");
    } else if (result === "O") {
        highlightWinningCells("O");
        showEndScreen("lose");
    } else {
        showEndScreen("draw");
    }
}

function showEndScreen(result) {
    const title = getElement("tictactoe-end-title");
    const message = getElement("tictactoe-end-message");

    if (result === "win") {
        if (title) {
            title.textContent = t("tictactoeYouWin");
        }

        if (message) {
            message.textContent = t("tictactoeYouWinText");
        }

        playSound("gameover-win");
    } else if (result === "lose") {
        if (title) {
            title.textContent = t("tictactoeYouLose");
        }

        if (message) {
            message.textContent = t("tictactoeYouLoseText");
        }

        playSound("lose");
    } else {
        if (title) {
            title.textContent = t("tictactoeDraw");
        }

        if (message) {
            message.textContent = t("tictactoeDrawText");
        }

        playSound("gameover-win");
    }

    showScreen("tictactoe-end-screen");
}

function startNewGame() {
    createBoard();
    showScreen("tictactoe-screen");
}

function goToMainMenu() {
    gameActive = false;
    computerThinking = false;
    showScreen("menu-screen");
}

function setBoardSize(size) {
    if (size !== 3 && size !== 5) {
        return;
    }

    boardSize = size;

    updateBoardSizeButtons();
    startNewGame();
}

function setupEvents() {
    const newGameButton =
        getElement("tictactoe-new-game-btn");

    if (newGameButton) {
        newGameButton.addEventListener("click", () => {
            playSound("click");
            startNewGame();
        });
    }

    const menuButton =
        getElement("tictactoe-menu-btn");

    if (menuButton) {
        menuButton.addEventListener("click", () => {
            playSound("click");
            goToMainMenu();
        });
    }

    const endNewGameButton =
        getElement("tictactoe-new-game-end-btn");

    if (endNewGameButton) {
        endNewGameButton.addEventListener("click", () => {
            playSound("click");
            startNewGame();
        });
    }

    const endMenuButton =
        getElement("tictactoe-menu-end-btn");

    if (endMenuButton) {
        endMenuButton.addEventListener("click", () => {
            playSound("click");
            goToMainMenu();
        });
    }

    const button3x3 =
        getElement("tictactoe-3x3-btn");

    if (button3x3) {
        button3x3.addEventListener("click", () => {
            playSound("click");
            setBoardSize(3);
        });
    }

    const button5x5 =
        getElement("tictactoe-5x5-btn");

    if (button5x5) {
        button5x5.addEventListener("click", () => {
            playSound("click");
            setBoardSize(5);
        });
    }

    window.addEventListener("languageChanged", () => {
        updateBoardSizeButtons();

        if (gameActive) {
            updateMessage(
                computerThinking
                    ? "tictactoeComputerTurn"
                    : "tictactoeYourTurn"
            );

            renderBoard();
        }
    });
}

function initTicTacToe() {
    if (!initialized) {
        setupEvents();
        initialized = true;
    }

    updateBoardSizeButtons();
    createBoard();
}

export {
    initTicTacToe,
    setBoardSize,
    startNewGame
};