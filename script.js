/**
 * ==========================================================================
 * TIC TAC TOE - Human vs Computer (Vanilla JavaScript)
 * ==========================================================================
 * 
 * Features:
 * 1. Human (Player X) vs Computer (Player O)
 * 2. Three AI difficulty levels:
 *    - Easy: Random move selection
 *    - Medium: Tactical rules (Win -> Block -> Center -> Random)
 *    - Hard: Unbeatable Minimax Algorithm
 * 3. Session Scoreboard (Human, Draws, Computer)
 * 4. Win/Draw detection & winning cell highlights
 * 5. Full keyboard & screen-reader accessibility
 */

// ==========================================
// 1. GAME CONSTANTS & STATE
// ==========================================

// All 8 possible winning combinations (3 rows, 3 columns, 2 diagonals)
const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6]
];

// Players
const HUMAN_PLAYER = "X";
const COMPUTER_PLAYER = "O";

// Game State
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = HUMAN_PLAYER;
let gameActive = false;
let isComputerThinking = false;
let difficulty = "medium"; // 'easy' | 'medium' | 'hard'

// Score tracking in memory for current browser session
let scores = {
  human: 0,
  draws: 0,
  computer: 0
};

// ==========================================
// 2. DOM ELEMENT REFERENCES
// ==========================================
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const resultModal = document.getElementById("result-modal");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resetScoreBtn = document.getElementById("reset-score-btn");
const homeBtn = document.getElementById("home-btn");
const modalPlayAgainBtn = document.getElementById("modal-play-again-btn");
const modalHomeBtn = document.getElementById("modal-home-btn");

const difficultyBtns = document.querySelectorAll(".difficulty-btn");
const difficultyBadge = document.getElementById("difficulty-badge");
const turnStatus = document.getElementById("turn-status");

const humanScoreEl = document.getElementById("human-score");
const drawsScoreEl = document.getElementById("draws-score");
const computerScoreEl = document.getElementById("computer-score");

const cells = document.querySelectorAll(".cell");

const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");

// ==========================================
// 3. INITIALIZATION & EVENT LISTENERS
// ==========================================

function init() {
  // Difficulty selection on Start Screen
  difficultyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      difficultyBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      difficulty = btn.dataset.difficulty;
    });
  });

  // Navigation & Control Buttons
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", resetGame);
  resetScoreBtn.addEventListener("click", resetScore);
  homeBtn.addEventListener("click", goToHome);
  modalPlayAgainBtn.addEventListener("click", () => {
    closeModal();
    resetGame();
  });
  modalHomeBtn.addEventListener("click", () => {
    closeModal();
    goToHome();
  });

  // Cell clicks
  cells.forEach(cell => {
    cell.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      handleCellClick(index);
    });
  });

  // Initial render of score
  updateScoreboardUI();
}

// ==========================================
// 4. SCREEN NAVIGATION & GAME LIFECYCLE
// ==========================================

/**
 * Starts a new game and transitions from Start Screen to Game Screen
 */
function startGame() {
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
  
  // Update difficulty badge
  const diffLabels = { easy: "Easy", medium: "Medium", hard: "Hard (Minimax)" };
  difficultyBadge.textContent = diffLabels[difficulty] || "Medium";

  resetGame();
}

/**
 * Returns user back to the Home / Start screen
 */
function goToHome() {
  closeModal();
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
  gameActive = false;
  isComputerThinking = false;
}

/**
 * Resets the 3x3 board for a fresh game match (keeps scoreboard intact)
 */
function resetGame() {
  closeModal();
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = HUMAN_PLAYER;
  gameActive = true;
  isComputerThinking = false;

  // Clear cells in DOM
  cells.forEach((cell, idx) => {
    cell.innerHTML = "";
    cell.classList.remove("filled", "winning-cell");
    cell.disabled = false;
    cell.setAttribute("aria-label", `Cell ${idx + 1}, empty`);
  });

  updateTurnIndicatorUI();
}

/**
 * Resets the session score counters to 0
 */
function resetScore() {
  scores.human = 0;
  scores.draws = 0;
  scores.computer = 0;
  updateScoreboardUI();
}

// ==========================================
// 5. PLAYER MOVES & TURN HANDLING
// ==========================================

/**
 * Handles human player's click on a board cell
 * @param {number} index - Board index (0-8)
 */
function handleCellClick(index) {
  // Prevent move if cell is filled, game is over, or computer is currently playing
  if (!gameActive || isComputerThinking || board[index] !== "") {
    return;
  }

  // 1. Place Human mark 'X'
  makeMove(index, HUMAN_PLAYER);

  // 2. Check if Human won
  const winCombo = checkWin(board, HUMAN_PLAYER);
  if (winCombo) {
    endGame("human", winCombo);
    return;
  }

  // 3. Check if game is a draw
  if (checkDraw(board)) {
    endGame("draw");
    return;
  }

  // 4. Switch to Computer turn
  currentPlayer = COMPUTER_PLAYER;
  isComputerThinking = true;
  updateTurnIndicatorUI();

  // 5. Trigger computer move with a short realistic thinking delay (~450ms)
  setTimeout(() => {
    if (!gameActive) return;

    computerTurn();
  }, 450);
}

/**
 * Executes the computer's turn based on selected difficulty
 */
function computerTurn() {
  let moveIndex;

  if (difficulty === "easy") {
    moveIndex = getEasyMove(board);
  } else if (difficulty === "medium") {
    moveIndex = getMediumMove(board);
  } else {
    moveIndex = getHardMove(board); // Minimax
  }

  // Place Computer mark 'O'
  if (moveIndex !== undefined && moveIndex !== -1) {
    makeMove(moveIndex, COMPUTER_PLAYER);
  }

  // Check if Computer won
  const winCombo = checkWin(board, COMPUTER_PLAYER);
  if (winCombo) {
    endGame("computer", winCombo);
    return;
  }

  // Check if game is a draw
  if (checkDraw(board)) {
    endGame("draw");
    return;
  }

  // Hand turn back to human player
  currentPlayer = HUMAN_PLAYER;
  isComputerThinking = false;
  updateTurnIndicatorUI();
}

/**
 * Updates board array and UI for a move
 * @param {number} index - Cell index
 * @param {string} player - "X" or "O"
 */
function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  
  cell.classList.add("filled");
  cell.disabled = true;
  cell.setAttribute("aria-label", `Cell ${index + 1}, ${player}`);

  const span = document.createElement("span");
  span.className = player === HUMAN_PLAYER ? "mark-x" : "mark-o";
  span.textContent = player;
  cell.appendChild(span);
}

// ==========================================
// 6. COMPUTER AI ALGORITHMS
// ==========================================

/**
 * Returns an array of indices of all currently empty cells
 * @param {string[]} currentBoard
 * @returns {number[]}
 */
function getEmptyIndices(currentBoard) {
  const empty = [];
  for (let i = 0; i < currentBoard.length; i++) {
    if (currentBoard[i] === "") {
      empty.push(i);
    }
  }
  return empty;
}

/**
 * EASY DIFFICULTY:
 * Selects a completely random available cell.
 * @param {string[]} currentBoard
 * @returns {number}
 */
function getEasyMove(currentBoard) {
  const emptyIndices = getEmptyIndices(currentBoard);
  if (emptyIndices.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[randomIndex];
}

/**
 * MEDIUM DIFFICULTY:
 * Tactical Decision Hierarchy:
 * 1. Immediate Win: If Computer can win in 1 move, take it.
 * 2. Block Opponent: If Human can win in 1 move, block it.
 * 3. Take Center: If index 4 is open, take it.
 * 4. Fallback: Take a random empty cell.
 * @param {string[]} currentBoard
 * @returns {number}
 */
function getMediumMove(currentBoard) {
  const emptyIndices = getEmptyIndices(currentBoard);

  // 1. Check if Computer ('O') can win immediately
  for (const index of emptyIndices) {
    const tempBoard = [...currentBoard];
    tempBoard[index] = COMPUTER_PLAYER;
    if (checkWin(tempBoard, COMPUTER_PLAYER)) {
      return index;
    }
  }

  // 2. Check if Human ('X') can win on next move and block them
  for (const index of emptyIndices) {
    const tempBoard = [...currentBoard];
    tempBoard[index] = HUMAN_PLAYER;
    if (checkWin(tempBoard, HUMAN_PLAYER)) {
      return index;
    }
  }

  // 3. Take Center position (index 4) if available
  if (currentBoard[4] === "") {
    return 4;
  }

  // 4. Prefer corners (0, 2, 6, 8) if available
  const corners = [0, 2, 6, 8].filter(i => currentBoard[i] === "");
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Otherwise, pick any random available move
  return getEasyMove(currentBoard);
}

/**
 * HARD DIFFICULTY:
 * Minimax Algorithm Implementation
 * Evaluates all future game branches recursively to pick the mathematically optimal move.
 * @param {string[]} currentBoard
 * @returns {number}
 */
function getHardMove(currentBoard) {
  // If first move and center is free, take center for speed
  if (currentBoard.filter(c => c === "").length === 8 && currentBoard[4] === "") {
    return 4;
  }

  let bestScore = -Infinity;
  let bestMove = -1;
  const emptyIndices = getEmptyIndices(currentBoard);

  for (const index of emptyIndices) {
    // Try move
    currentBoard[index] = COMPUTER_PLAYER;
    
    // Call minimax for human's turn (minimizing player)
    const score = minimax(currentBoard, 0, false);
    
    // Undo move
    currentBoard[index] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove !== -1 ? bestMove : getEasyMove(currentBoard);
}

/**
 * Recursive Minimax Function
 * - Maximizing Player: Computer ('O') aims for high score (+10)
 * - Minimizing Player: Human ('X') aims for low score (-10)
 * - Depth penalty encourages winning faster and losing slower.
 * 
 * @param {string[]} tempBoard - Current simulated board state
 * @param {number} depth - Recursion depth
 * @param {boolean} isMaximizing - True if Computer's turn, False if Human's turn
 * @returns {number} Evaluated score
 */
function minimax(tempBoard, depth, isMaximizing) {
  // Terminal state checks:
  // Computer Win: +10 minus depth (favors quicker victory)
  if (checkWin(tempBoard, COMPUTER_PLAYER)) {
    return 10 - depth;
  }
  // Human Win: depth minus 10 (favors delayed defeat if inevitable)
  if (checkWin(tempBoard, HUMAN_PLAYER)) {
    return depth - 10;
  }
  // Draw: score is 0
  if (checkDraw(tempBoard)) {
    return 0;
  }

  const emptyIndices = getEmptyIndices(tempBoard);

  if (isMaximizing) {
    // Computer's turn: maximize score
    let maxEval = -Infinity;
    for (const index of emptyIndices) {
      tempBoard[index] = COMPUTER_PLAYER;
      const evaluation = minimax(tempBoard, depth + 1, false);
      tempBoard[index] = "";
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    // Human's turn: minimize score
    let minEval = Infinity;
    for (const index of emptyIndices) {
      tempBoard[index] = HUMAN_PLAYER;
      const evaluation = minimax(tempBoard, depth + 1, true);
      tempBoard[index] = "";
      minEval = Math.min(minEval, evaluation);
    }
    return minEval;
  }
}

// ==========================================
// 7. WIN & DRAW EVALUATION
// ==========================================

/**
 * Checks if a specific player has achieved any of the 8 winning combinations.
 * @param {string[]} boardState
 * @param {string} player - "X" or "O"
 * @returns {number[] | null} The 3 winning cell indices if won, or null
 */
function checkWin(boardState, player) {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (
      boardState[a] === player &&
      boardState[b] === player &&
      boardState[c] === player
    ) {
      return combo;
    }
  }
  return null;
}

/**
 * Checks if the board is full with no empty cells
 * @param {string[]} boardState
 * @returns {boolean}
 */
function checkDraw(boardState) {
  return boardState.every(cell => cell !== "");
}

/**
 * Concludes the game, highlights winning cells, updates scoreboard, and displays the modal
 * @param {"human" | "computer" | "draw"} result
 * @param {number[]} [winningCombo]
 */
function endGame(result, winningCombo = null) {
  gameActive = false;
  isComputerThinking = false;

  // Highlight winning cells if applicable
  if (winningCombo) {
    winningCombo.forEach(index => {
      cells[index].classList.add("winning-cell");
    });
  }

  // Update scores and configure modal display
  if (result === "human") {
    scores.human++;
    modalIcon.textContent = "🎉";
    modalTitle.textContent = "You Win!";
    modalDesc.textContent = "Great job! You defeated the computer.";
    turnStatus.innerHTML = '<span class="turn-player-x">🎉 Victory! You won this round.</span>';
  } else if (result === "computer") {
    scores.computer++;
    modalIcon.textContent = "🤖";
    modalTitle.textContent = "Computer Wins";
    modalDesc.textContent = "Better luck next time!";
    turnStatus.innerHTML = '<span class="turn-player-o">🤖 Computer won this round.</span>';
  } else {
    scores.draws++;
    modalIcon.textContent = "🤝";
    modalTitle.textContent = "It's a Draw!";
    modalDesc.textContent = "That was a close game!";
    turnStatus.innerHTML = '<span class="turn-thinking">🤝 Game ended in a draw.</span>';
  }

  updateScoreboardUI();

  // Show result modal with a brief pleasant delay (600ms) to allow seeing final board
  setTimeout(() => {
    resultModal.classList.add("active");
  }, 600);
}

function closeModal() {
  resultModal.classList.remove("active");
}

// ==========================================
// 8. UI UPDATE HELPERS
// ==========================================

function updateTurnIndicatorUI() {
  if (!gameActive) return;

  if (isComputerThinking) {
    turnStatus.innerHTML = `
      <span class="turn-thinking">
        Computer is thinking
        <span class="thinking-dots">
          <span></span><span></span><span></span>
        </span>
      </span>
    `;
  } else {
    turnStatus.innerHTML = `
      <span class="turn-indicator turn-player-x">
        Your turn — X
      </span>
    `;
  }
}

function updateScoreboardUI() {
  humanScoreEl.textContent = scores.human;
  drawsScoreEl.textContent = scores.draws;
  computerScoreEl.textContent = scores.computer;
}

// ==========================================
// 9. START APP ON DOM LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", init);
