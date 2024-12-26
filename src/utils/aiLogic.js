import { findChoices, isBoardFull, checkWinner } from "../utils/gameLogic";

// Memoization map to store evaluated board states
const memo = new Map();

export const minimax = (board, depth, isMaximizing, alpha, beta, playerPieces, isFirstMove) => {
    // Generate a key for the current board state
    const boardKey = board.map(sq => sq ? sq.piece : null).join(',');

    // Check if the result for this board state is already computed
    if (memo.has(boardKey)) {
        return memo.get(boardKey);
    }

    // Early exit conditions: winner or full board
    if (checkWinner("ai", board)) return 1;
    if (checkWinner("user", board)) return -1;
    if (isBoardFull(board, playerPieces)) return 0;

    // Determine current player based on the maximizing/minimizing flag
    const currentPlayer = isMaximizing ? "ai" : "user";
    const possibleMoves = findChoices(board, currentPlayer, playerPieces[currentPlayer]);

    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Iterate over possible moves and recursively evaluate them
    for (let move of possibleMoves) {
        const [index, size] = move;

        // Prevent placing "L" in the center during the first move
        if (isFirstMove && currentPlayer === "ai" && size === "L" && index === 4) continue;

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: currentPlayer, piece: size }; // Make the move
        playerPieces[currentPlayer][size]--; // Decrease piece count for the current player

        // Recursively evaluate the resulting board
        const score = minimax(board, depth + 1, !isMaximizing, alpha, beta, playerPieces, false);

        // Log the score after each recursive call
        console.log(`Depth: ${depth}, Player: ${currentPlayer}, Move: [${index}, ${size}], Score: ${score}`);

        // Undo the move
        board[index] = prevSquare;
        playerPieces[currentPlayer][size]++;

        // Perform alpha-beta pruning
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

    // Memoize the result for this board state
    memo.set(boardKey, bestScore);

    // Log the best score for this board state before returning
    console.log(`Depth: ${depth}, Best Score for Player ${isMaximizing ? "AI" : "User"}: ${bestScore}`);
    return bestScore;
};

// Find the best move for the AI by evaluating all possible moves
export const findBestMove = (board, playerPieces, isFirstMove) => {
    let bestScore = -Infinity;
    let bestMove = null;

    const possibleMoves = findChoices(board, "ai", playerPieces.ai);

    for (let move of possibleMoves) {
        const [index, size] = move;

        // Prevent placing "L" in the center during the first move
        if (isFirstMove && size === "L" && index === 4) {
            continue; // Skip if it's the first move and "L" is being placed in the center
        }

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: "ai", piece: size }; // Make the move
        playerPieces.ai[size]--; // Decrease AI piece count

        // Get the score for this move
        const score = minimax(board, 0, false, -Infinity, Infinity, playerPieces, false);

        // Log the score for the best move
        console.log(`Evaluating Move: [${index}, ${size}], Score: ${score}`);

        // Undo the move
        board[index] = prevSquare;
        playerPieces.ai[size]++;

        // Update best move if this move gives a better score
        if (score > bestScore) {
            bestScore = score;
            bestMove = { index, piece: size };
        }
    }

    // Log the best move found
    console.log(`Best Move: [${bestMove.index}, ${bestMove.piece}], Score: ${bestScore}`);
    return bestMove;
};