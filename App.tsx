import React from 'react';
import { GameScene } from './components/GameScene';
import { AudioManager } from './components/AudioManager';
import { useGameStore } from './store';
import { GameState } from './types';

const UI: React.FC = () => {
  const { gameState, score, coins, startGame, reset } = useGameStore();

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 text-white">
        <h1 className="text-4xl md:text-6xl text-yellow-400 mb-8 text-center tracking-widest drop-shadow-[4px_4px_0_rgba(255,0,0,1)]">
          TORELLI'S<br/>RUN
        </h1>
        <div className="bg-gray-800 p-8 border-4 border-white rounded-lg text-center">
          <p className="mb-4 text-sm md:text-base text-gray-300">ESCAPE THE ANCIENT GUARDIAN</p>
          <div className="flex gap-8 mb-8 text-left text-xs md:text-sm font-mono text-gray-400">
             <div>
                <p>↑ / W : JUMP</p>
                <p>↓ / S : SLIDE</p>
                <p>← / A : LEFT</p>
                <p>→ / D : RIGHT</p>
             </div>
             <div className="border-l pl-4">
                <p>SWIPE UP: JUMP</p>
                <p>SWIPE DOWN: SLIDE</p>
                <p>SWIPE SIDE: MOVE</p>
             </div>
          </div>
          
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            START RUN
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-red-900/90 text-white">
        <h2 className="text-5xl mb-4 text-black drop-shadow-[2px_2px_0_#fff]">YOU DIED</h2>
        <div className="text-2xl mb-8 font-mono">
            <p>SCORE: {Math.floor(score)}</p>
            <p className="text-yellow-300">COINS: {coins}</p>
        </div>
        <button 
            onClick={reset}
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 font-bold border-b-4 border-gray-400 active:border-b-0 active:translate-y-1"
          >
            TRY AGAIN
          </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
      <div className="flex flex-col">
         <span className="text-white text-2xl drop-shadow-md font-bold tracking-wider">
            SCORE: {Math.floor(score)}
         </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-yellow-400 animate-spin rounded-sm"></div>
        <span className="text-yellow-400 text-2xl drop-shadow-md font-bold">
            {coins}
        </span>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="relative w-full h-full bg-gray-900">
      <AudioManager />
      <UI />
      <GameScene />
    </div>
  );
}

export default App;