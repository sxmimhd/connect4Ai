// Start.tsx
import { useState } from 'react';

// Mapping 5 difficulties to search depths
const difficulties = [
  { name: 'Very Easy', depth: 1, color: 'text-green-400 border-green-400' },
  { name: 'Easy', depth: 2, color: 'text-blue-400 border-blue-400' },
  { name: 'Medium', depth: 4, color: 'text-yellow-400 border-yellow-400' },
  { name: 'Hard', depth: 5, color: 'text-pink-500 border-pink-500 shadow-[0_0_10px_#ec4899]' }, // Matches Advanced 
  { name: 'Expert', depth: 7, color: 'text-purple-500 border-purple-500 shadow-[0_0_15px_#a855f7]' }
];

export default function Start({ onStartGame }) {
  const [selectedDepth, setSelectedDepth] = useState(4); // Default to Medium

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-white px-4 py-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] mb-8 md:mb-12 text-center">
        CONNECT FOUR
      </h1>

      <div className="w-full max-w-3xl flex flex-col items-center space-y-6 bg-gray-900/90 p-5 sm:p-8 md:p-10 rounded-xl border border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
        <h2 className="text-lg sm:text-2xl font-semibold tracking-widest text-pink-400 text-center">SELECT DIFFICULTY</h2>
        
        <div className="flex flex-wrap gap-3 justify-center">
          {difficulties.map((diff) => (
            <button
              key={diff.name}
              onClick={() => setSelectedDepth(diff.depth)}
              className={`px-3 sm:px-4 py-2 rounded-md border-2 transition-all duration-300 text-sm sm:text-base ${
                selectedDepth === diff.depth 
                  ? `${diff.color} bg-gray-800 scale-110` 
                  : 'border-gray-600 text-gray-500 hover:border-gray-400'
              }`}
            >
              {diff.name}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onStartGame(selectedDepth)}
          className="mt-4 sm:mt-8 px-8 sm:px-12 py-3 text-lg sm:text-xl font-bold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)]"
        >
          DROP TO PLAY
        </button>
      </div>
    </div>
  );
}