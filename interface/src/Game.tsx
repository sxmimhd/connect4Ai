// Game.tsx
import { useMemo, useState } from 'react';

const ROWS = 6;
const COLS = 7;
const PLAYER_PIECE = 1;
const AI_PIECE = 2;

type Board = number[][];
type GameStatus = 'playing' | 'player_won' | 'ai_won' | 'draw';

interface RecordStats {
  wins: number;
  losses: number;
}

interface GameProps {
  difficultyDepth: number;
  onRestart: () => void;
  onGameEnd: (result: Exclude<GameStatus, 'playing'>) => void;
  playerStats: RecordStats;
  aiStats: RecordStats;
}

interface PlayTurnResponse {
  status: 'success' | 'error' | 'game_over';
  ai_column?: number;
  message?: string;
}

const createEmptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const getNextOpenRow = (board: Board, col: number): number | null => {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row][col] === 0) {
      return row;
    }
  }
  return null;
};

const dropPiece = (board: Board, col: number, piece: number): Board | null => {
  const row = getNextOpenRow(board, col);
  if (row === null) {
    return null;
  }

  const nextBoard = board.map((boardRow) => [...boardRow]);
  nextBoard[row][col] = piece;
  return nextBoard;
};

const hasWinningMove = (board: Board, piece: number): boolean => {
  // Horizontal
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        board[row][col] === piece &&
        board[row][col + 1] === piece &&
        board[row][col + 2] === piece &&
        board[row][col + 3] === piece
      ) {
        return true;
      }
    }
  }

  // Vertical
  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (
        board[row][col] === piece &&
        board[row + 1][col] === piece &&
        board[row + 2][col] === piece &&
        board[row + 3][col] === piece
      ) {
        return true;
      }
    }
  }

  // Positive diagonal
  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        board[row][col] === piece &&
        board[row + 1][col + 1] === piece &&
        board[row + 2][col + 2] === piece &&
        board[row + 3][col + 3] === piece
      ) {
        return true;
      }
    }
  }

  // Negative diagonal
  for (let row = 3; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        board[row][col] === piece &&
        board[row - 1][col + 1] === piece &&
        board[row - 2][col + 2] === piece &&
        board[row - 3][col + 3] === piece
      ) {
        return true;
      }
    }
  }

  return false;
};

const isBoardFull = (board: Board): boolean =>
  board[0].every((cell) => cell !== 0);

export default function Game({
  difficultyDepth,
  onRestart,
  onGameEnd,
  playerStats,
  aiStats
}: GameProps) {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [isWaitingForAi, setIsWaitingForAi] = useState(false);
  const [error, setError] = useState('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sxmimhd-connect4-ai.hf.space';

  const isGameOver = gameStatus !== 'playing';
  const validColumns = useMemo(
    () => board[0].map((cell, col) => (cell === 0 ? col : -1)).filter((col) => col !== -1),
    [board]
  );

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (gameStatus === 'player_won') return 'You win! Great drop.';
    if (gameStatus === 'ai_won') return 'AI wins this round.';
    if (gameStatus === 'draw') return 'Draw game. No valid moves left.';
    if (isWaitingForAi) return 'AI is thinking...';
    return 'Your turn: pick a column to drop.';
  }, [error, gameStatus, isWaitingForAi]);

  const finishGameIfNeeded = (updatedBoard: Board): GameStatus | null => {
    if (hasWinningMove(updatedBoard, PLAYER_PIECE)) {
      setGameStatus('player_won');
      onGameEnd('player_won');
      return 'player_won';
    }
    if (hasWinningMove(updatedBoard, AI_PIECE)) {
      setGameStatus('ai_won');
      onGameEnd('ai_won');
      return 'ai_won';
    }
    if (isBoardFull(updatedBoard)) {
      setGameStatus('draw');
      onGameEnd('draw');
      return 'draw';
    }
    return null;
  };

  const handleColumnClick = async (colIndex: number) => {
    if (!isPlayerTurn || isWaitingForAi || isGameOver || board[0][colIndex] !== 0) {
      return;
    }

    setError('');
    setIsPlayerTurn(false);

    const playerBoard = dropPiece(board, colIndex, PLAYER_PIECE);
    if (!playerBoard) {
      setIsPlayerTurn(true);
      return;
    }
    setBoard(playerBoard);

    if (finishGameIfNeeded(playerBoard)) {
      return;
    }

    setIsWaitingForAi(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/play-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: playerBoard,
          depth: difficultyDepth
        })
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = (await response.json()) as PlayTurnResponse;
      if (data.status !== 'success' || typeof data.ai_column !== 'number') {
        throw new Error(data.message || 'AI could not provide a move.');
      }

      const aiBoard = dropPiece(playerBoard, data.ai_column, AI_PIECE);
      if (!aiBoard) {
        throw new Error('AI selected a full column.');
      }

      setBoard(aiBoard);
      if (!finishGameIfNeeded(aiBoard)) {
        setIsPlayerTurn(true);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to reach AI backend.';
      setError(`Connection issue: ${message}`);
      setIsPlayerTurn(true);
    } finally {
      setIsWaitingForAi(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-3 sm:p-4 md:p-6">
      {/* Header */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold italic tracking-wider text-pink-500 drop-shadow-[0_0_15px_#ec4899] mb-6 md:mb-8 text-center">
        CONNECT FOUR
      </h1>

      <div className="flex flex-col items-center mb-6 gap-2">
        <p className={`text-sm tracking-wide ${error ? 'text-red-400' : 'text-cyan-300'}`}>
          {statusMessage}
        </p>
        {isGameOver && (
          <button
            onClick={onRestart}
            className="px-5 py-2 rounded-full bg-gray-800 border border-pink-500 text-pink-300 hover:bg-gray-700 transition"
          >
            Back to Menu
          </button>
        )}
      </div>

      <div className="w-full max-w-[1200px] flex flex-col xl:flex-row items-center justify-center gap-5 xl:gap-10">
        
        {/* Left Panel - Player Stats */}
        <div className="order-2 xl:order-1 flex flex-col items-center p-4 sm:p-6 border-2 border-purple-600 rounded-xl bg-gray-900/90 shadow-[0_0_20px_rgba(147,51,234,0.4)] w-full max-w-[340px] xl:h-96 xl:w-48">
          <h2 className="text-xl font-bold text-purple-400 mb-4">YOU</h2>
          <div className="w-16 h-16 rounded-full border-2 border-purple-500 shadow-[0_0_15px_#a855f7] mb-8 overflow-hidden">
            <img src="/ss.jpg" alt="Player profile" className="w-full h-full object-cover" />
          </div>
          <div className="text-center space-y-4 text-sm text-gray-300">
            <p>WINS<br/><span className="text-2xl font-bold text-white">{playerStats.wins}</span></p>
            <p>LOSSES<br/><span className="text-2xl font-bold text-white">{playerStats.losses}</span></p>
          </div>
        </div>

        {/* Center - The Game Board */}
        <div className="order-1 xl:order-2 flex flex-col items-center border-4 border-gray-800 rounded-xl p-2 sm:p-3 md:p-4 bg-gray-900/95 shadow-[0_0_40px_rgba(236,72,153,0.3)] relative w-full overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3 min-w-max">
            {Array.from({ length: COLS }).map((_, colIndex) => {
              const isColumnPlayable = board[0][colIndex] === 0 && !isWaitingForAi && !isGameOver;
              const isHovered = hoveredColumn === colIndex && isColumnPlayable;
              return (
                <button
                  key={`drop-${colIndex}`}
                  onClick={() => handleColumnClick(colIndex)}
                  disabled={!isColumnPlayable || !isPlayerTurn}
                  onMouseEnter={() => setHoveredColumn(colIndex)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  className={`w-10 sm:w-12 md:w-14 h-7 sm:h-8 rounded-md border text-[10px] sm:text-xs font-bold transition ${
                    isHovered
                      ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_16px_rgba(168,85,247,0.8)]'
                      : isColumnPlayable
                      ? 'bg-gray-800 border-gray-600 text-purple-300 hover:bg-gray-700'
                      : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  DROP
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-gray-900 p-1.5 sm:p-2 rounded-lg min-w-max">
            {board.map((row, rIndex) => (
              row.map((cell, cIndex) => (
                <div 
                  key={`${rIndex}-${cIndex}`} 
                  onClick={() => handleColumnClick(cIndex)}
                  onMouseEnter={() => setHoveredColumn(cIndex)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 bg-black flex items-center justify-center transition-all ${
                    hoveredColumn === cIndex && board[0][cIndex] === 0 && !isWaitingForAi && !isGameOver
                      ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] cursor-pointer'
                      : 'border-gray-800'
                  } ${!isPlayerTurn || isWaitingForAi || isGameOver ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Render Pieces */}
                  {cell === 1 && (
                     <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-purple-600 shadow-[inset_0_0_10px_#fff,0_0_15px_#a855f7]"></div>
                  )}
                  {cell === 2 && (
                     <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-pink-600 shadow-[inset_0_0_10px_#fff,0_0_15px_#ec4899]"></div>
                  )}
                </div>
              ))
            ))}
          </div>
          
          {/* Column Indicators (1-7) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-3 sm:mt-4 text-center text-pink-500 font-bold min-w-max">
            {[1, 2, 3, 4, 5, 6, 7].map((num, index) => (
              <div
                key={num}
                className={`w-10 sm:w-12 md:w-14 text-xs sm:text-sm ${
                  validColumns.includes(index) ? 'text-pink-500' : 'text-gray-600'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - AI Stats */}
        <div className="order-3 flex flex-col items-center p-4 sm:p-6 border-2 border-pink-600 rounded-xl bg-gray-900/90 shadow-[0_0_20px_rgba(236,72,153,0.4)] w-full max-w-[340px] xl:h-96 xl:w-48">
          <h2 className="text-xl font-bold text-pink-400 mb-4">AI</h2>
          <div className="w-16 h-16 rounded-full border-2 border-pink-500 shadow-[0_0_15px_#ec4899] mb-4 flex items-center justify-center text-2xl">
            🤖
          </div>
          <p className="text-xs text-pink-500 mb-4 text-center">DIFFICULTY<br/>LEVEL {difficultyDepth}</p>
          <div className="text-center space-y-4 text-sm text-gray-300">
            <p>WINS<br/><span className="text-2xl font-bold text-white">{aiStats.wins}</span></p>
            <p>LOSSES<br/><span className="text-2xl font-bold text-white">{aiStats.losses}</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
