import { findChoices, isBoardFull, checkWinner } from "../utils/gameLogic";

// Memoization map to store evaluated board states
const memo = new Map();

const evaluateBoard = (board, playerPieces, currentPlayer) => {
    let score = 0;

    // Add a score for each piece on the board
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === currentPlayer) {
            // Assign score based on the piece size and position
            if (board[i].piece === "L") {
                score += 3;  // Larger pieces could have higher value if placed strategically
            } else {
                score += 1;
            }
        }
    }

    // Add points for available pieces (pieces that haven't been used yet)
    const availablePieces = playerPieces[currentPlayer];
    Object.entries(availablePieces).forEach(([size, count]) => {
        if (count > 0) {
            // Small bonus for available pieces, larger pieces get more weight
            const pieceRank = { L: 3, M: 2, S: 1 };
            score += pieceRank[size] * count;  // More available larger pieces are better
        }
    });

    // Check for center control (more influence if AI holds center)
    if (board[4] && board[4].player === currentPlayer) {
        score += 4;  // High score for occupying the center
    }

    // Check for blocking user wins and the potential of AI winning
    const opponent = currentPlayer === "ai" ? "user" : "ai";

    // Penalty for allowing the opponent to win
    if (checkWinner(opponent, board)) {
        score -= 100;  // High penalty if the opponent is winning
    }

    // Check if AI can win immediately
    if (checkWinner(currentPlayer, board)) {
        score += 100;  // High score if AI is winning
    }

    // Evaluate threats and potential winning moves
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === currentPlayer) {
            // If this move creates a winning position, add more weight
            if (checkWinner(currentPlayer, board)) {
                score += 10;
            }
        }
    }

    // Evaluate opportunity to take over opponent's piece
    for (let i = 0; i < board.length; i++) {
        if (board[i] && board[i].player === opponent) {
            // Check if AI has a larger piece that can take over this opponent's piece
            const opponentPiece = board[i].piece;
            if (
                (opponentPiece === "S" && playerPieces[currentPlayer]["M"] > 0) ||  // M takes S
                (opponentPiece === "M" && playerPieces[currentPlayer]["L"] > 0)     // L takes M
            ) {
                // Simulate taking over the opponent's piece
                const prevSquare = board[i];
                board[i] = { player: currentPlayer, piece: prevSquare.piece }; // "Take over"
                playerPieces[currentPlayer][prevSquare.piece]--; // Decrease piece count

                // Check if taking this piece creates a winning position
                if (checkWinner(currentPlayer, board)) {
                    score += 50;  // Reward high score for winning
                } else {
                    score += 5;  // Small reward for taking over a piece but not winning
                }

                // Undo the move (take back the opponent's piece)
                board[i] = prevSquare;
                playerPieces[currentPlayer][prevSquare.piece]++;
            }
        }
    }

    return score;
};

export const minimax = (board, depth, isMaximizing, alpha, beta, playerPieces, isFirstMove) => {
    // Base conditions: Check for winner or draw
    if (checkWinner("ai", board)) return 1;  // AI wins
    if (checkWinner("user", board)) return -1; // User wins
    if (isBoardFull(board)) return 0; // Draw
    if (depth >= 5) return evaluateBoard(board, playerPieces, isMaximizing ? "ai" : "user");  // Depth limit

    // Generate a key for the current board state
    const boardKey = board.map(sq => sq ? sq.piece : null).join(',');

    // Check if the result for this board state is already computed
    if (memo.has(boardKey)) {
        return memo.get(boardKey);
    }

    // Determine current player based on the maximizing/minimizing flag
    const currentPlayer = isMaximizing ? "ai" : "user";
    const possibleMoves = findChoices(board, currentPlayer, playerPieces[currentPlayer]);

    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Iterate over possible moves and recursively evaluate them
    for (let move of possibleMoves) {
        const [index, size] = move;

        // Prevent placing "L" in the center during the first move
        if (isFirstMove && currentPlayer === "ai" && size === "L" && index === 4) continue;

        // Prevent overriding own pieces
        if (board[index] && board[index].player === currentPlayer) continue; // Skip if the square is occupied by the same player's piece

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: currentPlayer, piece: size }; // Make the move
        playerPieces[currentPlayer][size]--; // Decrease piece count for the current player

        // Evaluate the board position
        const score = evaluateBoard(board, playerPieces, currentPlayer);

        // Recursively evaluate the resulting board
        const recursiveScore = minimax(board, depth + 1, !isMaximizing, alpha, beta, playerPieces, false);

        // Combine the scores (in this case, using the recursive score)
        const finalScore = score + recursiveScore;

        // Undo the move
        board[index] = prevSquare;
        playerPieces[currentPlayer][size]++;

        // Perform alpha-beta pruning
        if (isMaximizing) {
            bestScore = Math.max(bestScore, finalScore);
            alpha = Math.max(alpha, finalScore);
        } else {
            bestScore = Math.min(bestScore, finalScore);
            beta = Math.min(beta, finalScore);
        }

        // Prune the search tree if alpha-beta condition is met
        if (beta <= alpha) break;
    }

    // Memoize the result for this board state
    memo.set(boardKey, bestScore);

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

        // Prevent overriding own pieces
        if (board[index] && board[index].player === "ai") continue; // Skip if the square is occupied by AI's piece

        // Simulate the move
        const prevSquare = board[index];
        board[index] = { player: "ai", piece: size }; // Make the move
        playerPieces.ai[size]--; // Decrease AI piece count

        // Get the score for this move by evaluating the board
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
