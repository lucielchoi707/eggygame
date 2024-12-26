export const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
];

export const checkWinner = (player, board) => {
    return WINNING_COMBOS.some((combo) => combo.every((index) => board[index]?.player === player));
};

export const isBoardFull = (board) => {
    return board.every((square) => square); // Checks if all squares are filled
};


export const findChoices = (board, player, pieces) => {
    const pieceRank = { L: 3, M: 2, S: 1 };
    const choices = [];

    Object.entries(pieces).forEach(([size, count], index) => {
        if (count > 0) {
            for (let i = 0; i < board.length; i++) {
                if (!board[i] || pieceRank[size] > pieceRank[board[i]?.piece || ""]) {
                    choices.push([i, size]);
                }
            }
        }
    });

    return choices;
};