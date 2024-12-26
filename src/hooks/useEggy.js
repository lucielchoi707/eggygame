import { useState, useEffect } from "react";
import { checkWinner, isBoardFull } from "../utils/gameLogic";
import { findBestMove } from "../utils/aiLogic";


export const useEggy = () => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [playerPieces, setPlayerPieces] = useState({
    user: { L: 2, M: 3, S: 3 },
    ai: { L: 2, M: 3, S: 3 },
  });
  const [turn, setTurn] = useState("user");
  const [winner, setWinner] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null); // Track the selected piece
  const [isFirstMove, setIsFirstMove] = useState(true); // Track if it's the first move
  const [isUserFirst, setIsUserFirst] = useState(true); // Track who goes first (user or AI)

  const updateSquares = (index) => {
    if (winner) {
      console.log("Game already over. Winner:", winner);
      return;
    }

    if (selectedPiece === null) {
      console.log("No piece selected. Skipping move.");
      return;
    }

    // Prevent placing "L" in the center on the first move
    if (isFirstMove && selectedPiece === "L" && index === 4) {
      if (turn === "user" && isUserFirst) {
        alert("The 'L' piece cannot be placed in the center square on the first move.");
        return;
      } else if (turn === "ai" && !isUserFirst) {
        alert("The 'L' piece cannot be placed in the center square on the first move.");
        return;
      }
    }

    const pieceRank = { L: 3, M: 2, S: 1 };
    const currentSquare = squares[index];

    // Validate stacking rules
    if (currentSquare && pieceRank[selectedPiece] <= pieceRank[currentSquare.piece]) return;

    const newSquares = [...squares];
    newSquares[index] = { player: turn, piece: selectedPiece }; // Update square
    setSquares(newSquares);

    const newPlayerPieces = { ...playerPieces };

    // Ensure that `selectedPiece` is a valid key before accessing the Record
    if (selectedPiece && newPlayerPieces[turn].hasOwnProperty(selectedPiece)) {
      newPlayerPieces[turn][selectedPiece]--; // Deduct used piece
    }
    setPlayerPieces(newPlayerPieces);

    // Check winner or tie
    const W = checkWinner(turn, newSquares);
    if (W) {
      setWinner(turn);
    } else if (isBoardFull(newSquares, playerPieces)) {
      const tieWinner = determineWinnerInTie(newSquares);
      setWinner(tieWinner);  // Make sure this updates the winner state to "Tie"
    } else {
      setTurn(turn === "user" ? "ai" : "user");
    }

    setSelectedPiece(null);

    // Set `isFirstMove` to false after the first move is made
    if (isFirstMove) {
      setIsFirstMove(false);
    }
  };

  const determineWinnerInTie = (board) => {
    const userEggShellCount = board.filter((sq) => sq?.player === "user").length;
    const aiEggShellCount = board.filter((sq) => sq?.player === "ai").length;

    if (userEggShellCount > aiEggShellCount) {
      return "user";
    } else if (aiEggShellCount > userEggShellCount) {
      return "ai";
    }
    return "Tie";
  };

  useEffect(() => {
    if (turn === "ai" && !winner) {
      // AI's turn logic
      const bestMove = findBestMove(squares, playerPieces, isFirstMove);

      if (!bestMove || bestMove.index === -1 || !bestMove.piece) return;

      // AI checks first move rule (if it's the first move, avoid placing "L" in the center)
      if (isFirstMove && bestMove.piece === "L" && bestMove.index === 4) {
        // If AI is going first, prevent placing "L" in center
        if (!isUserFirst) {
          alert("AI cannot place 'L' in the center on the first move.");
          const alternativeMove = findBestMove(squares, playerPieces, true);
          if (alternativeMove) {
            bestMove.index = alternativeMove.index;
            bestMove.piece = alternativeMove.piece;
          }
        }
      }

      // Make AI's move
      const newSquares = [...squares];
      newSquares[bestMove.index] = { player: "ai", piece: bestMove.piece }; // AI makes move
      setSquares(newSquares);

      const newPlayerPieces = { ...playerPieces };
      newPlayerPieces.ai[bestMove.piece]--; // Deduct AI's piece
      setPlayerPieces(newPlayerPieces);

      const W = checkWinner("ai", newSquares);
      if (W) {
        setWinner("ai");
      } else if (isBoardFull(newSquares, playerPieces)) {
        const tieWinner = determineWinnerInTie(newSquares);
        setWinner(tieWinner);
      } else {
        setTurn("user"); // Return to user's turn
      }
    }
  }, [turn, winner, squares, playerPieces]);

  const handleToggleFirstPlayer = () => {
    setIsUserFirst((prev) => !prev); // Use previous state to update correctly
  };

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setPlayerPieces({
      user: { L: 2, M: 3, S: 3 },
      ai: { L: 2, M: 3, S: 3 },
    });
    setTurn(isUserFirst ? "user" : "ai");
    setWinner(null);
    setSelectedPiece(null);
    setIsFirstMove(true);
  };

  // Trigger reset whenever isUserFirst changes
  useEffect(() => {
    resetGame();
  }, [isUserFirst]);

  return {
    squares,
    turn,
    winner,
    playerPieces,
    isUserFirst,
    selectedPiece,
    setSelectedPiece,
    updateSquares,
    resetGame,
    handleToggleFirstPlayer,
  };
};
