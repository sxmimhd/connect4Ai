// App.tsx
import { useState } from 'react';
import Start from './Start';
import Game from './Game';

type Screen = 'start' | 'game';
type GameResult = 'player_won' | 'ai_won' | 'draw';

interface RecordStats {
  wins: number;
  losses: number;
}

export default function App() {
  // State to track which screen we are on: 'start' or 'game'
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  
  // State to track the chosen AI difficulty (depth)
  const [difficultyDepth, setDifficultyDepth] = useState(4); // Default to Medium
  const [playerStats, setPlayerStats] = useState<RecordStats>({ wins: 0, losses: 0 });
  const [aiStats, setAiStats] = useState<RecordStats>({ wins: 0, losses: 0 });

  // Function passed to Start.tsx to trigger the game
  const handleStartGame = (depth: number) => {
    setDifficultyDepth(depth);
    setCurrentScreen('game');
  };

  // Function passed to Game.tsx to return to the start menu
  const handleRestart = () => {
    setCurrentScreen('start');
  };

  const handleGameEnd = (result: GameResult) => {
    if (result === 'player_won') {
      setPlayerStats((prev) => ({ ...prev, wins: prev.wins + 1 }));
      setAiStats((prev) => ({ ...prev, losses: prev.losses + 1 }));
      return;
    }

    if (result === 'ai_won') {
      setPlayerStats((prev) => ({ ...prev, losses: prev.losses + 1 }));
      setAiStats((prev) => ({ ...prev, wins: prev.wins + 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-black/40">
      {currentScreen === 'start' ? (
        <Start onStartGame={handleStartGame} />
      ) : (
        <Game
          difficultyDepth={difficultyDepth}
          onRestart={handleRestart}
          onGameEnd={handleGameEnd}
          playerStats={playerStats}
          aiStats={aiStats}
        />
      )}
    </div>
  );
}