import React, { useState } from "react";
import { useEggy } from "./hooks/useEggy";
import Button from "./components/Button";
import Square from "./components/Square";
import { motion, AnimatePresence } from "framer-motion";

const InstructionsModal = ({ show, onClose }) => {
    return (
        show && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>How to Play</h2>
                    <p>Player and AI start with:</p>
                    <ul>
                        <li>2 Large (L), 3 Medium (M), and 3 Small (S) pieces.</li>
                    </ul>
                    <p>Rules:</p>
                    <ul>
                        <li>Each piece can be placed on the board.</li>
                        <li>Larger pieces can replace smaller opponent pieces (L &gt; M &gt; S).</li>
                        <li>Large pieces are not allowed in the center at the beginning of the game.</li>
                        <li>Win by connecting pieces in a straight or diagonal line.</li>
                        <li>If the board is filled, the player with more pieces wins.</li>
                    </ul>
                    <button className="close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        )
    );
};

const App = () => {
    const [showInstructions, setShowInstructions] = useState(false);

    const {
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
    } = useEggy();

    console.log("User Pieces: ", playerPieces.user);
    console.log("AI Pieces: ", playerPieces.ai);

    return (
        <div className="eggy-game">
            <h1>Eggy Game</h1>
            <div className="game-controls">
                <button className="how-to-play-btn" onClick={() => setShowInstructions(true)}>
                    How to Play
                </button>
                <InstructionsModal 
                    show={showInstructions} 
                    onClose={() => setShowInstructions(false)} 
                />
                <button
                    onClick={handleToggleFirstPlayer}
                    className="toggle-first"
                >
                    {isUserFirst ? "AI Go Second" : "AI Go First"}
                </button>
                <Button onClick={resetGame} text="Reset Game" />
            </div>
            <div className="player-controls">
                <div className="piece-selection-container">
                    <div className="player-piece-selection">
                        <h3>(click here) Your Pieces:</h3>
                        <div className="pieces">
                            {Object.entries(playerPieces.user).map(([piece, count]) => (
                                <button
                                    key={piece}
                                    disabled={count === 0}
                                    onClick={() => setSelectedPiece(piece)}
                                    className={`user-${piece} ${selectedPiece === piece ? "selected" : ""}`}
                                >
                                    {piece} ({count})
                                </button>
                            ))}
                        </div>
                    </div>
                    <h3>VS</h3>
                    <div className="player-piece-selection">
                        <h3>Remaining AI's Pieces:</h3>
                        <div className="pieces">
                            {Object.entries(playerPieces.ai).map(([piece, count]) => (
                                <span
                                    key={piece}
                                    className={`ai-${piece} ai-piece`}
                                >
                                    {piece} ({count})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <h3>{turn === "user" ? "Your Turn" : "AI's Turn"}</h3>
                {/* Warning message if the user hasn't selected a piece */}
                {turn === "user" && !selectedPiece && (
                    <p className="warning">Please select a piece before placing it.</p>
                )}
            </div>

            <div className="game">
                {squares.map((square, index) => (
                    <Square
                        key={index}
                        ind={index}
                        updateSquares={() => {
                            if (!selectedPiece) {
                                alert("Please select a piece before placing it.");
                                return;
                            }
                            updateSquares(index);
                        }}
                        clsName={square ? `${square.player}-${square.piece}` : ""}
                    />
                ))}
            </div>
            <AnimatePresence>
                {winner && (
                    <motion.div
                        key={"parent-box"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="winner"
                    >
                        <motion.div
                            key={"child-box"}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="text"
                        >
                            <motion.h2
                                initial={{ scale: 0, y: 100 }}
                                animate={{ scale: 1, y: 0, transition: { y: { delay: 0.7 }, duration: 0.7 } }}
                            >
                                {winner === "Tie" ? "It's a Tie!" : `${winner === "user" ? "You Win!" : "AI Wins!"}`}
                            </motion.h2>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, transition: { delay: 1.3, duration: 0.2 } }}
                                className="win"
                            >
                                {winner !== "Tie" && <span className="winner-display">{winner === "user" ? "User" : "AI"}</span>}
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, transition: { delay: 1.5, duration: 0.3 } }}
                            >
                                <Button onClick={resetGame} text="Play Again" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
