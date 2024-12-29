import { findChoices, isBoardFull, checkWinner } from "../utils/gameLogic";

const evaluateBoard = (board, playerPieces, currentPlayer) => {
    let score = 0;

    // Add score for occupied board positions by current player
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === currentPlayer) {
            if (board[i].piece === "L") {
                score += 3;
            } else {
                score += 1;
            }
        }
    }

    const availablePieces = playerPieces[currentPlayer];
    Object.entries(availablePieces).forEach(([size, count]) => {
        if (count > 0) {
            const pieceRank = { L: 3, M: 2, S: 1 };
            score += pieceRank[size] * count;
        }
    });

    // Center control (higher score for occupying the center)
    if (board[4] && board[4].player === currentPlayer) {
        score += 4; // Big reward for controlling the center
    }

    // Block opponent from winning and prioritize AI's potential wins
    const opponent = currentPlayer === "ai" ? "user" : "ai";
    if (checkWinner(opponent, board)) {
        score -= 100; // Penalize if opponent is winning
    }

    if (checkWinner(currentPlayer, board)) {
        score += 100; // Reward if AI wins
    }

    // Consider chains of moves (two-move wins, forks)
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === currentPlayer) {
            // Check if placing this piece contributes to a winning position
            if (checkWinner(currentPlayer, board)) {
                score += 10; // Major score boost for winning
            }
        }
    }

    // Evaluate opponent's possible moves and threat levels (to block or counteract)
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === opponent) {
            const opponentPiece = board[i].piece;
            if (
                (opponentPiece === "S" && playerPieces[currentPlayer]["M"] > 0) ||
                (opponentPiece === "M" && playerPieces[currentPlayer]["L"] > 0)
            ) {
                // Simulate taking the opponent's piece if possible
                const prevSquare = board[i];
                board[i] = { player: currentPlayer, piece: prevSquare.piece };
                playerPieces[currentPlayer][prevSquare.piece]--;

                // Check if taking over the opponent's piece could lead to a win
                if (checkWinner(currentPlayer, board)) {
                    score += 50; // Strong bonus for winning by taking over
                } else {
                    score += 5; // Smaller reward for taking over a piece
                }

                // Undo the simulated move
                board[i] = prevSquare;
                playerPieces[currentPlayer][prevSquare.piece]++;
            }
        }
    }

    return score;
};

// Minimax with deeper lookahead and alpha-beta pruning
export const minimax = (board, depth, isMaximizing, alpha, beta, playerPieces, isFirstMove) => {
    if (checkWinner("ai", board)) return 1; // AI wins
    if (checkWinner("user", board)) return -1; // User wins
    if (isBoardFull(board)) return 0; // Draw
    if (depth >= 6) return evaluateBoard(board, playerPieces, isMaximizing ? "ai" : "user"); // Increased depth

    // Determine current player based on the maximizing/minimizing flag
    const currentPlayer = isMaximizing ? "ai" : "user";
    const possibleMoves = findChoices(board, currentPlayer, playerPieces[currentPlayer]);

    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Try all possible moves
    for (let move of possibleMoves) {
        const [index, size] = move;

        // Prevent placing "L" in the center during first move
        if (isFirstMove && currentPlayer === "ai" && size === "L" && index === 4) continue;

        // Skip move if the square is already occupied by the same player's piece
        if (board[index] && board[index].player === currentPlayer) continue;

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: currentPlayer, piece: size };
        playerPieces[currentPlayer][size]--;

        // Recursively evaluate the move
        const score = minimax(board, depth + 1, !isMaximizing, alpha, beta, playerPieces, false);

        // Undo the move
        board[index] = prevSquare;
        playerPieces[currentPlayer][size]++;

        // Alpha-Beta pruning
        if (isMaximizing) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
        } else {
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, score);
        }

        // Prune the search tree if alpha-beta condition is met
        if (beta <= alpha) break;
    }

    return bestScore;
};

// Find the best move for the AI by evaluating all possible moves
export const findBestMove = (board, playerPieces, isFirstMove) => {
    let bestScore = -Infinity;
    let bestMove = null;

    const possibleMoves = findChoices(board, "ai", playerPieces.ai);

    for (let move of possibleMoves) {
        const [index, size] = move;

        // Prevent placing "L" in the center during first move
        if (isFirstMove && size === "L" && index === 4) continue;

        // Prevent overriding own pieces
        if (board[index] && board[index].player === "ai") continue;

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: "ai", piece: size };
        playerPieces.ai[size]--;

        // Evaluate the board using the minimax strategy
        const score = minimax(board, 0, false, -Infinity, Infinity, playerPieces, false);

        // Undo the move
        board[index] = prevSquare;
        playerPieces.ai[size]++;

        // Update best move if this move gives a better score
        if (score > bestScore) {
            bestScore = score;
            bestMove = { index, piece: size };
        }
    }

    return bestMove;
};
